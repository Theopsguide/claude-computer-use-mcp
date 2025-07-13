import { monitoring } from './monitoring.js';
import { BrowserController } from './browser-controller.js';
import { SECURITY_CONFIG } from './config.js';

export interface ClaudeIntegrationConfig {
  enableSmartWaiting: boolean;
  enableContextualScreenshots: boolean;
  enableProgressTracking: boolean;
  enableWorkflowRecording: boolean;
  enableSemanticSelectors: boolean;
}

export interface WorkflowStep {
  step: number;
  action: string;
  selector?: string;
  value?: string;
  screenshot?: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface SmartWaitCondition {
  type: 'element' | 'text' | 'url' | 'network' | 'custom';
  condition: string;
  timeout?: number;
}

export class ClaudeIntegration {
  private browserController: BrowserController;
  private config: ClaudeIntegrationConfig;
  private workflows: Map<string, WorkflowStep[]> = new Map();

  constructor(browserController: BrowserController, config: Partial<ClaudeIntegrationConfig> = {}) {
    this.browserController = browserController;
    this.config = {
      enableSmartWaiting: true,
      enableContextualScreenshots: true,
      enableProgressTracking: true,
      enableWorkflowRecording: false,
      enableSemanticSelectors: true,
      ...config
    };
  }

  // Smart waiting that understands context
  async smartWait(sessionId: string, conditions: SmartWaitCondition[]): Promise<{ success: boolean; matchedCondition?: string }> {
    if (!this.config.enableSmartWaiting) {
      throw new Error('Smart waiting is disabled');
    }

    const session = this.browserController.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    for (const condition of conditions) {
      try {
        switch (condition.type) {
          case 'element':
            await session.page.waitForSelector(condition.condition, { 
              timeout: condition.timeout || 10000 
            });
            return { success: true, matchedCondition: `element:${condition.condition}` };

          case 'text':
            await session.page.waitForFunction(
              (text: string) => document.body.innerText.includes(text),
              condition.condition,
              { timeout: condition.timeout || 10000 }
            );
            return { success: true, matchedCondition: `text:${condition.condition}` };

          case 'url':
            await session.page.waitForURL(condition.condition, { 
              timeout: condition.timeout || 10000 
            });
            return { success: true, matchedCondition: `url:${condition.condition}` };

          case 'network':
            await session.page.waitForResponse(
              response => response.url().includes(condition.condition),
              { timeout: condition.timeout || 10000 }
            );
            return { success: true, matchedCondition: `network:${condition.condition}` };

          case 'custom':
            await session.page.waitForFunction(
              condition.condition,
              {},
              { timeout: condition.timeout || 10000 }
            );
            return { success: true, matchedCondition: `custom:${condition.condition}` };
        }
      } catch (error) {
        // Continue to next condition
        continue;
      }
    }

    return { success: false };
  }

  // Take contextual screenshots with annotations
  async contextualScreenshot(sessionId: string, context: string): Promise<{ 
    screenshot: string; 
    context: string; 
    elements: Array<{ selector: string; text: string; bounds: any }>;
    timestamp: number;
  }> {
    if (!this.config.enableContextualScreenshots) {
      throw new Error('Contextual screenshots are disabled');
    }

    const session = this.browserController.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    // Take screenshot
    const screenshot = await this.browserController.screenshot(sessionId, false);

    // Identify interactive elements
    const elements = await session.page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, input, select, textarea, a[href], [onclick], [role=\"button\"]');
      return Array.from(interactiveElements).slice(0, 50).map((el: Element) => {
        const rect = el.getBoundingClientRect();
        return {
          selector: this.generateSelector(el),
          text: el.textContent?.trim().substring(0, 100) || '',
          bounds: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        };
      });
    });

    monitoring.auditLog({
      level: 'info',
      sessionId,
      action: 'contextual_screenshot',
      details: { context, elementsFound: elements.length }
    });

    return {
      screenshot: screenshot.toString('base64'),
      context,
      elements,
      timestamp: Date.now()
    };
  }

  // Record workflow steps for reproducibility
  async recordWorkflowStep(sessionId: string, action: string, details: any = {}): Promise<void> {
    if (!this.config.enableWorkflowRecording) return;

    if (!this.workflows.has(sessionId)) {
      this.workflows.set(sessionId, []);
    }

    const workflow = this.workflows.get(sessionId)!;
    const step: WorkflowStep = {
      step: workflow.length + 1,
      action,
      timestamp: Date.now(),
      success: true,
      ...details
    };

    // Take screenshot for visual verification
    try {
      const screenshot = await this.browserController.screenshot(sessionId, false);
      step.screenshot = screenshot.toString('base64');
    } catch (error) {
      // Screenshot failed, continue without it
    }

    workflow.push(step);

    monitoring.auditLog({
      level: 'debug',
      sessionId,
      action: 'workflow_step_recorded',
      details: { step: step.step, action }
    });
  }

  // Get recorded workflow
  async getWorkflow(sessionId: string): Promise<WorkflowStep[]> {
    return this.workflows.get(sessionId) || [];
  }

  // Replay workflow steps
  async replayWorkflow(sessionId: string, workflow?: WorkflowStep[]): Promise<{ 
    success: boolean; 
    stepsCompleted: number; 
    errors: string[] 
  }> {
    const workflowSteps = workflow || this.workflows.get(sessionId);
    if (!workflowSteps || workflowSteps.length === 0) {
      throw new Error('No workflow to replay');
    }

    let stepsCompleted = 0;
    const errors: string[] = [];

    for (const step of workflowSteps) {
      try {
        switch (step.action) {
          case 'navigate':
            await this.browserController.navigate(sessionId, step.value!);
            break;
          case 'click':
            await this.browserController.click(sessionId, step.selector!);
            break;
          case 'type':
            await this.browserController.type(sessionId, step.selector!, step.value!);
            break;
          case 'wait':
            await this.browserController.waitForSelector(sessionId, step.selector!);
            break;
          // Add more actions as needed
        }
        stepsCompleted++;
      } catch (error) {
        errors.push(`Step ${step.step}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break; // Stop on first error
      }
    }

    return {
      success: errors.length === 0,
      stepsCompleted,
      errors
    };
  }

  // Generate semantic selectors that are more stable
  async generateSemanticSelector(sessionId: string, element: string): Promise<{ 
    selector: string; 
    alternatives: string[]; 
    confidence: number 
  }> {
    if (!this.config.enableSemanticSelectors) {
      return { selector: element, alternatives: [], confidence: 1.0 };
    }

    const session = this.browserController.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const selectorInfo = await session.page.evaluate((selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;

      const alternatives: string[] = [];
      let confidence = 0.5;

      // Try ID selector (highest confidence)
      if (el.id) {
        alternatives.push(`#${el.id}`);
        confidence = Math.max(confidence, 0.9);
      }

      // Try data attributes
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') && attr.value) {
          alternatives.push(`[${attr.name}=\"${attr.value}\"]`);
          confidence = Math.max(confidence, 0.8);
        }
      });

      // Try aria labels
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) {
        alternatives.push(`[aria-label=\"${ariaLabel}\"]`);
        confidence = Math.max(confidence, 0.8);
      }

      // Try text content for buttons/links
      if (['BUTTON', 'A'].includes(el.tagName) && el.textContent?.trim()) {
        const text = el.textContent.trim();
        alternatives.push(`${el.tagName.toLowerCase()}:has-text(\"${text}\")`);
        confidence = Math.max(confidence, 0.7);
      }

      // Try class-based selector
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          alternatives.push(`.${classes.join('.')}`);
          confidence = Math.max(confidence, 0.6);
        }
      }

      return { alternatives, confidence };
    }, element);

    if (!selectorInfo) {
      return { selector: element, alternatives: [], confidence: 0.1 };
    }

    return {
      selector: selectorInfo.alternatives[0] || element,
      alternatives: selectorInfo.alternatives,
      confidence: selectorInfo.confidence
    };
  }

  // Analyze page for Claude-friendly insights
  async analyzePage(sessionId: string): Promise<{
    title: string;
    url: string;
    interactiveElements: number;
    forms: number;
    images: number;
    links: number;
    pageStructure: any;
    accessibilityScore: number;
    suggestions: string[];
  }> {
    const session = this.browserController.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const analysis = await session.page.evaluate(() => {
      const forms = document.querySelectorAll('form').length;
      const images = document.querySelectorAll('img').length;
      const links = document.querySelectorAll('a[href]').length;
      const interactiveElements = document.querySelectorAll('button, input, select, textarea, [onclick], [role=\"button\"]').length;

      // Simple page structure analysis
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.textContent?.trim().substring(0, 100) || ''
      }));

      const pageStructure = {
        headings,
        hasNavigation: !!document.querySelector('nav, [role=\"navigation\"]'),
        hasMain: !!document.querySelector('main, [role=\"main\"]'),
        hasFooter: !!document.querySelector('footer, [role=\"contentinfo\"]')
      };

      // Basic accessibility checks
      const missingAltImages = document.querySelectorAll('img:not([alt])').length;
      const missingLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').length;
      const accessibilityScore = Math.max(0, 100 - (missingAltImages * 5) - (missingLabels * 10));

      return {
        interactiveElements,
        forms,
        images,
        links,
        pageStructure,
        accessibilityScore
      };
    });

    const title = await session.page.title();
    const url = session.page.url();

    // Generate suggestions based on analysis
    const suggestions: string[] = [];
    if (analysis.forms > 0) {
      suggestions.push('Page contains forms - use browser_fill_form for efficient form filling');
    }
    if (analysis.interactiveElements > 20) {
      suggestions.push('Many interactive elements found - consider using semantic selectors');
    }
    if (analysis.accessibilityScore < 80) {
      suggestions.push('Page has accessibility issues - run browser_accessibility_audit for details');
    }

    return {
      title,
      url,
      ...analysis,
      suggestions
    };
  }

  // Enhanced error handling with recovery suggestions
  async handleError(sessionId: string, error: Error, context: any): Promise<{
    error: string;
    suggestions: string[];
    recoveryActions: Array<{ action: string; description: string }>;
  }> {
    const suggestions: string[] = [];
    const recoveryActions: Array<{ action: string; description: string }> = [];

    // Analyze error type and provide specific suggestions
    if (error.message.includes('waiting for selector')) {
      suggestions.push('Element not found - try using smart wait with multiple conditions');
      suggestions.push('Check if page is fully loaded with browser_wait_navigation');
      recoveryActions.push({
        action: 'take_screenshot',
        description: 'Take a screenshot to see current page state'
      });
      recoveryActions.push({
        action: 'analyze_page',
        description: 'Analyze page structure to find alternative selectors'
      });
    }

    if (error.message.includes('Navigation timeout')) {
      suggestions.push('Page loading slowly - increase timeout or use different waitUntil condition');
      recoveryActions.push({
        action: 'check_network',
        description: 'Enable network logging to debug slow requests'
      });
    }

    if (error.message.includes('Session') && error.message.includes('not found')) {
      suggestions.push('Browser session expired - create a new session');
      recoveryActions.push({
        action: 'create_session',
        description: 'Launch a new browser session'
      });
    }

    monitoring.auditLog({
      level: 'error',
      sessionId,
      action: 'error_handled',
      details: {
        error: error.message,
        context,
        suggestionsProvided: suggestions.length,
        recoveryActionsProvided: recoveryActions.length
      }
    });

    return {
      error: error.message,
      suggestions,
      recoveryActions
    };
  }

  // Cleanup workflows for session
  async cleanup(sessionId: string): Promise<void> {
    this.workflows.delete(sessionId);
  }
}