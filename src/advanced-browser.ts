import { Page, Browser, BrowserContext, ElementHandle, FileChooser, Download } from 'playwright';
import { BrowserSession } from './browser-controller.js';
import { validateUrl, validateSelector, validateText, SecurityError, ValidationError } from './validation.js';
import { SECURITY_CONFIG } from './config.js';
import { monitoring, monitored } from './monitoring.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TabInfo {
  index: number;
  url: string;
  title: string;
  active: boolean;
}

export interface FormField {
  selector: string;
  value: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
}

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalBytes: number;
  requestCount: number;
  jsHeapUsedSize: number;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  headers: Record<string, string>;
  size: number;
  duration: number;
  timestamp: number;
}

export interface AccessibilityInfo {
  violations: Array<{
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    nodes: Array<{
      target: string;
      html: string;
    }>;
  }>;
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export class AdvancedBrowserController {
  private sessions: Map<string, BrowserSession>;
  private tabManagement: Map<string, Page[]> = new Map();
  private networkLogs: Map<string, NetworkRequest[]> = new Map();
  private downloadPaths: Map<string, string> = new Map();

  constructor(sessions: Map<string, BrowserSession>) {
    this.sessions = sessions;
  }

  async createNewTab(sessionId: string, url?: string): Promise<{ tabIndex: number; url: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    if (url) {
      validateUrl(url, SECURITY_CONFIG);
    }

    const newPage = await session.context.newPage();
    
    if (!this.tabManagement.has(sessionId)) {
      this.tabManagement.set(sessionId, [session.page]);
    }
    
    const tabs = this.tabManagement.get(sessionId)!;
    tabs.push(newPage);

    if (url) {
      await newPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    }

    monitoring.auditLog({
      level: 'info',
      sessionId,
      action: 'tab_created',
      details: { tabIndex: tabs.length - 1, url: url || 'about:blank' }
    });

    return { 
      tabIndex: tabs.length - 1, 
      url: url || 'about:blank' 
    };
  }

  async switchToTab(sessionId: string, tabIndex: number): Promise<{ success: boolean; url: string; title: string }> {
    const tabs = this.tabManagement.get(sessionId);
    if (!tabs || tabIndex < 0 || tabIndex >= tabs.length) {
      throw new Error(`Tab ${tabIndex} not found in session ${sessionId}`);
    }

    const targetPage = tabs[tabIndex];
    await targetPage.bringToFront();

    // Update the session's active page reference
    const session = this.sessions.get(sessionId)!;
    session.page = targetPage;

    const url = targetPage.url();
    const title = await targetPage.title();

    monitoring.auditLog({
      level: 'info',
      sessionId,
      action: 'tab_switched',
      details: { tabIndex, url, title }
    });

    return { success: true, url, title };
  }

  async closeTab(sessionId: string, tabIndex: number): Promise<{ success: boolean }> {
    const tabs = this.tabManagement.get(sessionId);
    if (!tabs || tabIndex < 0 || tabIndex >= tabs.length) {
      throw new Error(`Tab ${tabIndex} not found in session ${sessionId}`);
    }

    if (tabs.length === 1) {
      throw new Error('Cannot close the last tab in a session');
    }

    const pageToClose = tabs[tabIndex];
    await pageToClose.close();
    tabs.splice(tabIndex, 1);

    // If we closed the active tab, switch to the first tab
    const session = this.sessions.get(sessionId)!;
    if (session.page === pageToClose) {
      session.page = tabs[0];
      await tabs[0].bringToFront();
    }

    monitoring.auditLog({
      level: 'info',
      sessionId,
      action: 'tab_closed',
      details: { tabIndex }
    });

    return { success: true };
  }

  async listTabs(sessionId: string): Promise<TabInfo[]> {
    const tabs = this.tabManagement.get(sessionId);
    const session = this.sessions.get(sessionId);
    
    if (!tabs || !session) {
      return [];
    }

    const tabInfos: TabInfo[] = [];
    
    for (let i = 0; i < tabs.length; i++) {
      const page = tabs[i];
      try {
        const url = page.url();
        const title = await page.title();
        const active = page === session.page;
        
        tabInfos.push({ index: i, url, title, active });
      } catch (error) {
        tabInfos.push({ 
          index: i, 
          url: 'error', 
          title: 'Error retrieving tab info', 
          active: false 
        });
      }
    }

    return tabInfos;
  }

  async fillForm(sessionId: string, formData: FormField[], submitSelector?: string): Promise<{ success: boolean; fieldsProcessed: number }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    let fieldsProcessed = 0;

    for (const field of formData) {
      validateSelector(field.selector, SECURITY_CONFIG);
      validateText(field.value, SECURITY_CONFIG);

      try {
        const element = await session.page.waitForSelector(field.selector, { timeout: 5000 });
        if (!element) continue;

        // Clear field first
        await element.fill('');
        
        // Handle different input types
        if (field.type === 'password') {
          await element.type(field.value, { delay: 50 }); // Slight delay for password fields
        } else {
          await element.fill(field.value);
        }

        fieldsProcessed++;
      } catch (error) {
        console.warn(`Failed to fill field ${field.selector}:`, error);
      }
    }

    // Submit form if selector provided
    if (submitSelector) {
      validateSelector(submitSelector, SECURITY_CONFIG);
      try {
        await session.page.click(submitSelector);
      } catch (error) {
        console.warn(`Failed to submit form with selector ${submitSelector}:`, error);
      }
    }

    monitoring.auditLog({
      level: 'info',
      sessionId,
      action: 'form_filled',
      details: { fieldsProcessed, totalFields: formData.length, submitted: !!submitSelector }
    });

    return { success: true, fieldsProcessed };
  }

  async uploadFile(sessionId: string, fileSelector: string, filePath: string): Promise<{ success: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    validateSelector(fileSelector, SECURITY_CONFIG);

    // Validate file path and extension
    const fileExtension = path.extname(filePath).toLowerCase();
    if (!SECURITY_CONFIG.allowedFileExtensions.includes(fileExtension)) {
      throw new SecurityError(`File extension ${fileExtension} not allowed`);
    }

    // Check file size
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > SECURITY_CONFIG.maxFileSize) {
        throw new SecurityError(`File size ${stats.size} exceeds maximum allowed size ${SECURITY_CONFIG.maxFileSize}`);
      }
    } catch (error) {
      throw new ValidationError(`Cannot access file: ${filePath}`);
    }

    const fileInput = await session.page.waitForSelector(fileSelector, { timeout: 10000 });
    if (!fileInput) {
      throw new Error(`File input selector '${fileSelector}' not found`);
    }

    await fileInput.setInputFiles(filePath);

    monitoring.auditLog({
      level: 'info',
      sessionId,
      action: 'file_uploaded',
      details: { fileSelector, filePath: path.basename(filePath) }
    });

    return { success: true };
  }

  async downloadFile(sessionId: string, downloadSelector: string, downloadPath?: string): Promise<{ success: boolean; filePath: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    validateSelector(downloadSelector, SECURITY_CONFIG);

    const defaultDownloadPath = downloadPath || `./downloads/${sessionId}`;
    await fs.mkdir(defaultDownloadPath, { recursive: true });

    this.downloadPaths.set(sessionId, defaultDownloadPath);

    // Set up download handling
    const downloadPromise = session.page.waitForEvent('download');
    
    // Trigger download
    await session.page.click(downloadSelector);
    
    const download = await downloadPromise;
    const filename = download.suggestedFilename() || `download_${Date.now()}`;
    const filePath = path.join(defaultDownloadPath, filename);
    
    await download.saveAs(filePath);

    monitoring.auditLog({
      level: 'info',
      sessionId,
      action: 'file_downloaded',
      details: { downloadSelector, filePath: filename }
    });

    return { success: true, filePath };
  }

  async takeAdvancedScreenshot(sessionId: string, options: {
    element?: string;
    quality?: number;
    format?: 'png' | 'jpeg';
    clip?: { x: number; y: number; width: number; height: number };
  } = {}): Promise<{ screenshot: string; mimeType: string; metadata: any }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const { element, quality = 90, format = 'png', clip } = options;

    let screenshotOptions: any = {
      type: format,
      quality: format === 'jpeg' ? quality : undefined,
      clip
    };

    let screenshot: Buffer;
    let metadata: any = {
      format,
      timestamp: Date.now(),
      url: session.page.url(),
      viewport: await session.page.viewportSize()
    };

    if (element) {
      validateSelector(element, SECURITY_CONFIG);
      const elementHandle = await session.page.waitForSelector(element, { timeout: 10000 });
      if (!elementHandle) {
        throw new Error(`Element '${element}' not found`);
      }
      screenshot = await elementHandle.screenshot(screenshotOptions);
      metadata.element = element;
    } else {
      screenshot = await session.page.screenshot(screenshotOptions);
    }

    return {
      screenshot: screenshot.toString('base64'),
      mimeType: `image/${format}`,
      metadata
    };
  }

  async scroll(sessionId: string, direction: 'up' | 'down' | 'left' | 'right', distance: number = 500): Promise<{ success: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const scrollMappings = {
      up: `window.scrollBy(0, -${distance})`,
      down: `window.scrollBy(0, ${distance})`,
      left: `window.scrollBy(-${distance}, 0)`,
      right: `window.scrollBy(${distance}, 0)`
    };

    await session.page.evaluate(scrollMappings[direction]);

    return { success: true };
  }

  async dragAndDrop(sessionId: string, sourceSelector: string, targetSelector: string): Promise<{ success: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    validateSelector(sourceSelector, SECURITY_CONFIG);
    validateSelector(targetSelector, SECURITY_CONFIG);

    const sourceElement = await session.page.waitForSelector(sourceSelector, { timeout: 10000 });
    const targetElement = await session.page.waitForSelector(targetSelector, { timeout: 10000 });

    if (!sourceElement || !targetElement) {
      throw new Error('Source or target element not found for drag and drop');
    }

    // Drag and drop using mouse actions
    const sourceBox = await sourceElement.boundingBox();
    const targetBox = await targetElement.boundingBox();
    if (sourceBox && targetBox) {
      await session.page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await session.page.mouse.down();
      await session.page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
      await session.page.mouse.up();
    }

    monitoring.auditLog({
      level: 'info',
      sessionId,
      action: 'drag_drop',
      details: { sourceSelector, targetSelector }
    });

    return { success: true };
  }

  async waitForNavigation(sessionId: string, timeout: number = 30000, waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'load'): Promise<{ success: boolean; url: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    await session.page.waitForLoadState(waitUntil, { timeout });
    const url = session.page.url();

    return { success: true, url };
  }

  async enableNetworkLogging(sessionId: string): Promise<{ success: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    if (!this.networkLogs.has(sessionId)) {
      this.networkLogs.set(sessionId, []);
    }

    const logs = this.networkLogs.get(sessionId)!;

    session.page.on('request', (request) => {
      const startTime = Date.now();
      
      request.response().then((response) => {
        if (response) {
          logs.push({
            url: request.url(),
            method: request.method(),
            status: response.status(),
            headers: response.headers(),
            size: 0, // TODO: Calculate actual size
            duration: Date.now() - startTime,
            timestamp: startTime
          });
        }
      }).catch(() => {
        // Ignore failed requests for logging
      });
    });

    return { success: true };
  }

  async getNetworkLogs(sessionId: string, includeHeaders: boolean = false): Promise<NetworkRequest[]> {
    const logs = this.networkLogs.get(sessionId) || [];
    
    if (!includeHeaders) {
      return logs.map(log => ({ ...log, headers: {} }));
    }
    
    return logs;
  }

  async getPerformanceMetrics(sessionId: string): Promise<PerformanceMetrics> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const metrics = await session.page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      
      return {
        loadTime: perf.loadEventEnd - perf.navigationStart,
        domContentLoaded: perf.domContentLoadedEventEnd - perf.navigationStart,
        firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: lcpEntries[lcpEntries.length - 1]?.startTime || 0,
        totalBytes: 0, // Will be calculated from network logs
        requestCount: performance.getEntriesByType('resource').length,
        jsHeapUsedSize: (performance as any).memory?.usedJSHeapSize || 0
      };
    });

    // Add network data from logs
    const networkLogs = this.networkLogs.get(sessionId) || [];
    metrics.totalBytes = networkLogs.reduce((total, log) => total + log.size, 0);

    return metrics;
  }

  async runAccessibilityAudit(sessionId: string, selector?: string): Promise<AccessibilityInfo> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    if (selector) {
      validateSelector(selector, SECURITY_CONFIG);
    }

    // Inject axe-core for accessibility testing
    await session.page.addScriptTag({
      url: 'https://cdn.jsdelivr.net/npm/axe-core@4.7.2/axe.min.js'
    });

    const results = await session.page.evaluate((targetSelector) => {
      return new Promise((resolve) => {
        const axe = (window as any).axe;
        const options = targetSelector ? { include: [targetSelector] } : {};
        
        axe.run(options, (err: any, results: any) => {
          if (err) {
            resolve({ violations: [], summary: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 } });
            return;
          }
          
          const violations = results.violations.map((violation: any) => ({
            id: violation.id,
            impact: violation.impact,
            description: violation.description,
            nodes: violation.nodes.map((node: any) => ({
              target: node.target.join(' '),
              html: node.html
            }))
          }));
          
          const summary = violations.reduce((acc: any, violation: any) => {
            acc.total += violation.nodes.length;
            acc[violation.impact] = (acc[violation.impact] || 0) + violation.nodes.length;
            return acc;
          }, { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 });
          
          resolve({ violations, summary });
        });
      });
    }, selector);

    return results as AccessibilityInfo;
  }

  async cleanup(sessionId: string): Promise<void> {
    // Clean up tabs
    const tabs = this.tabManagement.get(sessionId);
    if (tabs) {
      for (const tab of tabs) {
        try {
          await tab.close();
        } catch (error) {
          console.warn('Error closing tab:', error);
        }
      }
      this.tabManagement.delete(sessionId);
    }

    // Clean up network logs
    this.networkLogs.delete(sessionId);
    this.downloadPaths.delete(sessionId);
  }
}