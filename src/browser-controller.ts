import { Browser, BrowserContext, Page, chromium } from 'playwright';
import crypto from 'crypto';
import { SecurityConfig } from './types.js';
import { SECURITY_CONFIG } from './config.js';
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

  constructor(securityConfig: SecurityConfig = SECURITY_CONFIG) {
    this.securityConfig = securityConfig;
    
    // Cleanup old sessions periodically
    setInterval(() => this.cleanupExpiredSessions(), 60000); // Every minute
  }

  private generateSecureSessionId(): string {
    return `session-${crypto.randomBytes(16).toString('hex')}`;
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];
    
    for (const [id, createdTime] of this.sessionCreationTimes.entries()) {
      if (now - createdTime > this.securityConfig.sessionTimeout) {
        expiredSessions.push(id);
      }
    }
    
    for (const id of expiredSessions) {
      this.closeSession(id).catch(err => 
        console.error(`Failed to cleanup expired session ${id}:`, err)
      );
    }
  }

  async createSession(headless: boolean = true): Promise<string> {
    // Check session limit
    if (this.sessions.size >= this.securityConfig.maxSessions) {
      throw new SecurityError(
        `Maximum number of sessions (${this.securityConfig.maxSessions}) reached`
      );
    }

    const id = this.generateSecureSessionId();
    
    try {
      const browser = await chromium.launch({
        headless,
        args: [
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--no-first-run',
          '--no-default-browser-check'
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
      
      return id;
    } catch (error) {
      throw new Error(`Failed to create browser session: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      // Wrap the script in a try-catch to prevent page crashes
      const wrappedScript = `
        try {
          ${script}
        } catch (error) {
          return { error: error.message || 'Script execution failed' };
        }
      `;
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
}