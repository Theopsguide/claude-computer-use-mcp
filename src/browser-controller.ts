import { Browser, BrowserContext, Page, chromium } from 'playwright';
import crypto from 'crypto';
import { SecurityConfig } from './types.js';
import { SECURITY_CONFIG } from './config.js';
import { CookieManager } from './cookie-manager.js';
import { 
  validateUrl, 
  validateSelector, 
  validateText, 
  validateScript, 
  validateSessionId, 
  validateTimeout,
  validateAttribute,
  ValidationError,
  SecurityError
} from './validation.js';

export interface BrowserSession {
  id: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  createdAt: Date;
}

export class BrowserController {
  private sessions: Map<string, BrowserSession> = new Map();
  private securityConfig: SecurityConfig;
  private sessionCreationTimes: Map<string, number> = new Map();
  private cookieManager: CookieManager;
  private cleanupInterval?: NodeJS.Timeout;
  // Rate limiting tracking
  private sessionCreationHistory: number[] = [];
  // Session creation lock to prevent race conditions
  private sessionCreationLock = false;

  constructor(securityConfig: SecurityConfig = SECURITY_CONFIG) {
    this.securityConfig = securityConfig;
    
    try {
      this.cookieManager = new CookieManager();
      
      // Initialize cookie manager asynchronously
      this.cookieManager.initialize().catch(error => {
        console.error('Failed to initialize cookie manager:', error);
      });
    } catch (error) {
      throw new Error(`Failed to create browser controller: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Cleanup old sessions periodically
    this.cleanupInterval = setInterval(() => this.cleanupExpiredSessions(), 60000); // Every minute
  }

  private generateSecureSessionId(): string {
    return `session-${crypto.randomBytes(16).toString('hex')}`;
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000; // 1 minute ago
    const oneHourAgo = now - 60 * 60 * 1000; // 1 hour ago
    
    // Clean up old entries
    this.sessionCreationHistory = this.sessionCreationHistory.filter(
      timestamp => timestamp > oneHourAgo
    );
    
    // Count recent sessions
    const sessionsInLastMinute = this.sessionCreationHistory.filter(
      timestamp => timestamp > oneMinuteAgo
    ).length;
    
    const sessionsInLastHour = this.sessionCreationHistory.length;
    
    // Check rate limits
    if (sessionsInLastMinute >= this.securityConfig.maxSessionsPerMinute) {
      throw new SecurityError(
        `Rate limit exceeded: too many sessions created in the last minute (max: ${this.securityConfig.maxSessionsPerMinute})`
      );
    }
    
    if (sessionsInLastHour >= this.securityConfig.maxSessionsPerHour) {
      throw new SecurityError(
        `Rate limit exceeded: too many sessions created in the last hour (max: ${this.securityConfig.maxSessionsPerHour})`
      );
    }
  }

  private recordSessionCreation(): void {
    this.sessionCreationHistory.push(Date.now());
  }

  private cleanupPromise: Promise<void> | null = null;
  
  private async cleanupExpiredSessions(): Promise<void> {
    // Prevent concurrent cleanup runs using a promise-based lock
    if (this.cleanupPromise) {
      return this.cleanupPromise;
    }
    
    this.cleanupPromise = this.performCleanup();
    try {
      await this.cleanupPromise;
    } finally {
      this.cleanupPromise = null;
    }
  }
  
  private async performCleanup(): Promise<void> {
    const now = Date.now();
    const expiredSessions: string[] = [];
    
    // Create a snapshot of session times to avoid race conditions
    const sessionTimes = Array.from(this.sessionCreationTimes.entries());
    
    for (const [id, createdTime] of sessionTimes) {
      if (now - createdTime > this.securityConfig.sessionTimeout) {
        expiredSessions.push(id);
      }
    }
    
    // Close expired sessions in parallel but with error handling
    const cleanupPromises = expiredSessions.map(async (id) => {
      try {
        await this.closeSession(id);
      } catch (err) {
        console.error(`Failed to cleanup expired session ${id}:`, err);
      }
    });
    
    await Promise.allSettled(cleanupPromises);
  }

  async createSession(headless: boolean = true): Promise<string> {
    // Prevent concurrent session creation to avoid race conditions
    if (this.sessionCreationLock) {
      throw new SecurityError('Session creation in progress, please try again');
    }
    
    this.sessionCreationLock = true;
    
    try {
      // Check rate limits first
      this.checkRateLimit();
      
      // Check session limit (with lock held to prevent race conditions)
      if (this.sessions.size >= this.securityConfig.maxSessions) {
        throw new SecurityError(
          `Maximum number of sessions (${this.securityConfig.maxSessions}) reached`
        );
      }

      const id = this.generateSecureSessionId();
      const browser = await chromium.launch({
        headless,
        args: [
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        // Security headers
        extraHTTPHeaders: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        },
        // Disable permissions
        permissions: [],
        // Block certain resource types for security
        // Note: This is commented out to maintain functionality but can be enabled for stricter security
        // blockResources: ['image', 'font', 'stylesheet']
      });
      
      const page = await context.newPage();
      
      this.sessions.set(id, {
        id,
        browser,
        context,
        page,
        createdAt: new Date()
      });
      
      this.sessionCreationTimes.set(id, Date.now());
      this.recordSessionCreation(); // Record for rate limiting
      
      return id;
    } catch (error) {
      throw new Error(`Failed to create browser session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.sessionCreationLock = false;
    }
  }

  getSession(sessionId: string): BrowserSession | undefined {
    validateSessionId(sessionId);
    return this.sessions.get(sessionId);
  }

  async closeSession(sessionId: string): Promise<void> {
    validateSessionId(sessionId);
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        await session.browser.close();
      } catch (error) {
        console.error(`Error closing browser for session ${sessionId}:`, error);
      } finally {
        this.sessions.delete(sessionId);
        this.sessionCreationTimes.delete(sessionId);
      }
    }
  }

  async closeAllSessions(): Promise<void> {
    const closePromises = Array.from(this.sessions.values()).map(async (session) => {
      try {
        await session.browser.close();
      } catch (error) {
        console.error(`Error closing browser for session ${session.id}:`, error);
      }
    });
    
    await Promise.allSettled(closePromises);
    this.sessions.clear();
    this.sessionCreationTimes.clear();
  }

  async navigate(sessionId: string, url: string): Promise<void> {
    validateUrl(url, this.securityConfig);
    
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      await session.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 // 30 second timeout
      });
    } catch (error) {
      throw new Error(`Failed to navigate to ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async screenshot(sessionId: string, fullPage: boolean = false): Promise<Buffer> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      return await session.page.screenshot({ fullPage });
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async click(sessionId: string, selector: string): Promise<void> {
    validateSelector(selector, this.securityConfig);
    
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      await session.page.click(selector, { timeout: 10000 });
    } catch (error) {
      throw new Error(`Failed to click on selector '${selector}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async type(sessionId: string, selector: string, text: string): Promise<void> {
    validateSelector(selector, this.securityConfig);
    validateText(text, this.securityConfig);
    
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      await session.page.fill(selector, text);
    } catch (error) {
      throw new Error(`Failed to type into selector '${selector}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async waitForSelector(sessionId: string, selector: string, timeout?: number): Promise<void> {
    validateSelector(selector, this.securityConfig);
    const validatedTimeout = validateTimeout(timeout);
    
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      await session.page.waitForSelector(selector, { timeout: validatedTimeout });
    } catch (error) {
      throw new Error(`Failed to wait for selector '${selector}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async evaluate(sessionId: string, script: string): Promise<unknown> {
    validateScript(script, this.securityConfig);
    
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      // Use Function constructor for safer execution with isolated scope
      const wrappedScript = `
        (function() {
          'use strict';
          try {
            return (function() {
              ${script}
            })();
          } catch (error) {
            return { 
              error: error.message || 'Script execution failed',
              stack: error.stack || 'No stack trace available'
            };
          }
        })()
      `;
      
      // Validate the wrapped script can be parsed before execution
      try {
        new Function(wrappedScript);
      } catch (syntaxError) {
        throw new ValidationError(`Script syntax error: ${syntaxError instanceof Error ? syntaxError.message : 'Unknown error'}`);
      }
      
      return await session.page.evaluate(wrappedScript);
    } catch (error) {
      throw new Error(`Failed to execute script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getText(sessionId: string, selector: string): Promise<string> {
    validateSelector(selector, this.securityConfig);
    
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      const text = await session.page.textContent(selector);
      return text !== null ? text : '';
    } catch (error) {
      throw new Error(`Failed to get text from selector '${selector}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAttribute(sessionId: string, selector: string, attribute: string): Promise<string | null> {
    validateSelector(selector, this.securityConfig);
    validateAttribute(attribute);
    
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      return await session.page.getAttribute(selector, attribute);
    } catch (error) {
      throw new Error(`Failed to get attribute '${attribute}' from selector '${selector}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async selectOption(sessionId: string, selector: string, value: string): Promise<void> {
    validateSelector(selector, this.securityConfig);
    validateText(value, this.securityConfig);
    
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      await session.page.selectOption(selector, value);
    } catch (error) {
      throw new Error(`Failed to select option '${value}' in selector '${selector}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUrl(sessionId: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    return session.page.url();
  }

  async getTitle(sessionId: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      return await session.page.title();
    } catch (error) {
      throw new Error(`Failed to get page title: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listSessions(): Promise<Array<{ id: string; url: string; title: string; createdAt: Date }>> {
    const sessionList = [];
    
    for (const session of this.sessions.values()) {
      try {
        const title = await session.page.title();
        sessionList.push({
          id: session.id,
          url: session.page.url(),
          title,
          createdAt: session.createdAt
        });
      } catch (error) {
        // If we can't get the title, still include the session
        sessionList.push({
          id: session.id,
          url: session.page.url(),
          title: '<error retrieving title>',
          createdAt: session.createdAt
        });
      }
    }
    
    return sessionList;
  }

  async saveCookies(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      const cookies = await session.context.cookies();
      await this.cookieManager.saveCookies(sessionId, cookies);
    } catch (error) {
      throw new Error(`Failed to save cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadCookies(sessionId: string, targetDomain?: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      const cookies = await this.cookieManager.loadCookies(sessionId, targetDomain);
      if (cookies.length > 0) {
        await session.context.addCookies(cookies);
      }
    } catch (error) {
      throw new Error(`Failed to load cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearCookies(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      // Clear cookies from browser context
      await session.context.clearCookies();
      // Clear stored cookies
      await this.cookieManager.clearCookies(sessionId);
    } catch (error) {
      throw new Error(`Failed to clear cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCookies(sessionId: string, urls?: string[]): Promise<any[]> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    try {
      const cookies = await session.context.cookies(urls);
      // Return cookies without sensitive values for security
      return cookies.map(cookie => ({
        name: cookie.name,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite
      }));
    } catch (error) {
      throw new Error(`Failed to get cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cleanup(): Promise<void> {
    // Clear the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    // Close all sessions
    await this.closeAllSessions();
  }
}