import { createCipheriv, createDecipheriv, randomBytes, scrypt, CipherGCM, DecipherGCM } from 'crypto';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Cookie as PlaywrightCookie } from 'playwright';

// Properly typed promisified scrypt function
const scryptAsync = promisify<string | Buffer, string | Buffer, number, Buffer>(scrypt);

interface StoredCookie extends PlaywrightCookie {
  encryptedValue?: string;
}

interface CookieStore {
  domain: string;
  cookies: StoredCookie[];
  lastUpdated: string;
}

interface EncryptedCookieData {
  iv: string;
  salt: string;
  encrypted: string;
}

export class CookieManager {
  private storageDir: string;
  private encryptionKey: string;
  private algorithm = 'aes-256-gcm';
  // Performance optimization: cache derived keys
  private keyCache = new Map<string, Buffer>();

  constructor(storageDir: string = './.cookie-storage', masterKey?: string) {
    this.storageDir = storageDir;
    this.encryptionKey = masterKey || process.env.COOKIE_ENCRYPTION_KEY || '';
    
    if (!this.encryptionKey) {
      throw new Error(
        'Cookie encryption key is required for security. ' +
        'Provide a master key in constructor or set COOKIE_ENCRYPTION_KEY environment variable.'
      );
    }
    
    if (this.encryptionKey.length < 32) {
      throw new Error(
        'Cookie encryption key must be at least 32 characters long for security.'
      );
    }
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      
      // Create a secure permissions mask for the storage directory
      await fs.chmod(this.storageDir, 0o700);
    } catch (error) {
      throw new Error(`Failed to initialize cookie storage: ${error}`);
    }
  }

  private async getDerivedKey(salt: Buffer): Promise<Buffer> {
    const cacheKey = salt.toString('hex');
    
    // Check cache first for performance
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }
    
    // Derive key if not cached
    const key = await scryptAsync(this.encryptionKey, salt, 32) as Buffer;
    
    // Cache for future use (with size limit to prevent memory bloat)
    if (this.keyCache.size < 100) {
      this.keyCache.set(cacheKey, key);
    }
    
    return key;
  }

  private async encrypt(text: string): Promise<EncryptedCookieData> {
    try {
      const salt = randomBytes(32);
      const key = await this.getDerivedKey(salt);
      const iv = randomBytes(16);
      
      const cipher = createCipheriv(this.algorithm, key, iv) as CipherGCM;
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        encrypted: encrypted + ':' + authTag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error(`Failed to encrypt cookie value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async decrypt(data: EncryptedCookieData): Promise<string> {
    try {
      const salt = Buffer.from(data.salt, 'hex');
      const key = await this.getDerivedKey(salt);
      const iv = Buffer.from(data.iv, 'hex');
      
      const [encrypted, authTag] = data.encrypted.split(':');
      
      const decipher = createDecipheriv(this.algorithm, key, iv) as DecipherGCM;
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error(`Failed to decrypt cookie value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveCookies(sessionId: string, cookies: PlaywrightCookie[]): Promise<void> {
    try {
      const processedCookies: StoredCookie[] = [];
      
      for (const cookie of cookies) {
        const storedCookie: StoredCookie = { ...cookie };
        
        // Encrypt sensitive cookie values (encryption key is guaranteed to exist)
        if (cookie.value) {
          const encrypted = await this.encrypt(cookie.value);
          storedCookie.encryptedValue = JSON.stringify(encrypted);
          storedCookie.value = ''; // Clear plaintext value
        }
        
        processedCookies.push(storedCookie);
      }
      
      // Group cookies by domain
      const cookiesByDomain = new Map<string, CookieStore>();
      
      for (const cookie of processedCookies) {
        const domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
        
        if (!cookiesByDomain.has(domain)) {
          cookiesByDomain.set(domain, {
            domain,
            cookies: [],
            lastUpdated: new Date().toISOString()
          });
        }
        
        cookiesByDomain.get(domain)!.cookies.push(cookie);
      }
      
      // Save to files
      const sessionDir = path.join(this.storageDir, sessionId);
      await fs.mkdir(sessionDir, { recursive: true });
      
      for (const [domain, store] of cookiesByDomain) {
        const filename = `${domain.replace(/[^a-zA-Z0-9.-]/g, '_')}.json`;
        const filepath = path.join(sessionDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(store, null, 2), 'utf8');
        await fs.chmod(filepath, 0o600); // Secure file permissions
      }
    } catch (error) {
      throw new Error(`Failed to save cookies: ${error}`);
    }
  }

  async loadCookies(sessionId: string, domain?: string): Promise<PlaywrightCookie[]> {
    try {
      const sessionDir = path.join(this.storageDir, sessionId);
      const cookies: PlaywrightCookie[] = [];
      
      try {
        await fs.access(sessionDir);
      } catch {
        return cookies; // No stored cookies for this session
      }
      
      const files = await fs.readdir(sessionDir);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filepath = path.join(sessionDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const store: CookieStore = JSON.parse(content);
        
        // Filter by domain if specified
        if (domain && !store.domain.includes(domain)) continue;
        
        for (const storedCookie of store.cookies) {
          // Destructure to exclude encryptedValue
          const { encryptedValue, ...playwrightCookie } = storedCookie;
          
          // Decrypt cookie value if encrypted (encryption key is guaranteed to exist)
          if (encryptedValue) {
            try {
              const encrypted = JSON.parse(encryptedValue) as EncryptedCookieData;
              const decrypted = await this.decrypt(encrypted);
              playwrightCookie.value = decrypted;
            } catch (error) {
              console.error(`Failed to decrypt cookie for ${playwrightCookie.name}:`, error);
              continue; // Skip this cookie
            }
          }
          
          cookies.push(playwrightCookie);
        }
      }
      
      return cookies;
    } catch (error) {
      throw new Error(`Failed to load cookies: ${error}`);
    }
  }

  async clearCookies(sessionId: string): Promise<void> {
    try {
      const sessionDir = path.join(this.storageDir, sessionId);
      
      try {
        await fs.rm(sessionDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore if directory doesn't exist
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }
    } catch (error) {
      throw new Error(`Failed to clear cookies: ${error}`);
    }
  }

  async listSessions(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.storageDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to list sessions: ${error}`);
    }
  }

  async importBrowserCookies(browserProfile: string): Promise<PlaywrightCookie[]> {
    // This is a placeholder for browser-specific cookie import logic
    // In a real implementation, this would:
    // 1. Detect the browser type (Chrome, Firefox, Safari, etc.)
    // 2. Locate the browser's cookie storage
    // 3. Read and decrypt browser-specific cookie formats
    // 4. Convert to Playwright cookie format
    
    throw new Error('Browser cookie import not yet implemented');
  }
}