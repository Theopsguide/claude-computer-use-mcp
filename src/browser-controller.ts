import { Browser, BrowserContext, Page, chromium } from 'playwright';

export interface BrowserSession {
  id: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  createdAt: Date;
}

export class BrowserController {
  private sessions: Map<string, BrowserSession> = new Map();
  private nextSessionId = 1;

  async createSession(headless: boolean = true): Promise<string> {
    const id = `session-${this.nextSessionId++}`;
    
    const browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    this.sessions.set(id, {
      id,
      browser,
      context,
      page,
      createdAt: new Date()
    });
    
    return id;
  }

  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.browser.close();
      this.sessions.delete(sessionId);
    }
  }

  async closeAllSessions(): Promise<void> {
    for (const session of this.sessions.values()) {
      await session.browser.close();
    }
    this.sessions.clear();
  }

  async navigate(sessionId: string, url: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    await session.page.goto(url, { waitUntil: 'networkidle' });
  }

  async screenshot(sessionId: string, fullPage: boolean = false): Promise<Buffer> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    return await session.page.screenshot({ fullPage });
  }

  async click(sessionId: string, selector: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    await session.page.click(selector);
  }

  async type(sessionId: string, selector: string, text: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    await session.page.fill(selector, text);
  }

  async waitForSelector(sessionId: string, selector: string, timeout?: number): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    await session.page.waitForSelector(selector, { timeout });
  }

  async evaluate(sessionId: string, script: string): Promise<any> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    return await session.page.evaluate(script);
  }

  async getText(sessionId: string, selector: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    return await session.page.textContent(selector) || '';
  }

  async getAttribute(sessionId: string, selector: string, attribute: string): Promise<string | null> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    return await session.page.getAttribute(selector, attribute);
  }

  async selectOption(sessionId: string, selector: string, value: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    await session.page.selectOption(selector, value);
  }

  async getUrl(sessionId: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    return session.page.url();
  }

  async getTitle(sessionId: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    return await session.page.title();
  }

  listSessions(): Array<{ id: string; url: string; title: string; createdAt: Date }> {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      url: session.page.url(),
      title: '', // Would need to be async to get title
      createdAt: session.createdAt
    }));
  }
}