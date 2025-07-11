import { BrowserController } from './browser-controller';

export function createTools(browserController: BrowserController) {
  return {
    browser_launch: {
      description: 'Launch a new browser instance',
      inputSchema: {
        type: 'object',
        properties: {
          headless: {
            type: 'boolean',
            description: 'Run browser in headless mode (default: true)',
            default: true
          }
        }
      },
      handler: async (args: any) => {
        const { headless = true } = args;
        const sessionId = await browserController.createSession(headless);
        return {
          sessionId,
          message: `Browser session ${sessionId} created successfully`
        };
      }
    },

    browser_navigate: {
      description: 'Navigate to a URL in the browser',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          url: { type: 'string', description: 'URL to navigate to' }
        },
        required: ['sessionId', 'url']
      },
      handler: async (args: any) => {
        const { sessionId, url } = args;
        await browserController.navigate(sessionId, url);
        return { success: true, url };
      }
    },

    browser_screenshot: {
      description: 'Take a screenshot of the current page',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          fullPage: { 
            type: 'boolean', 
            description: 'Capture full page (default: false)',
            default: false 
          }
        },
        required: ['sessionId']
      },
      handler: async (args: any) => {
        const { sessionId, fullPage = false } = args;
        const screenshot = await browserController.screenshot(sessionId, fullPage);
        return {
          screenshot: screenshot.toString('base64'),
          mimeType: 'image/png'
        };
      }
    },

    browser_click: {
      description: 'Click on an element',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          selector: { type: 'string', description: 'CSS selector or text to click' }
        },
        required: ['sessionId', 'selector']
      },
      handler: async (args: any) => {
        const { sessionId, selector } = args;
        await browserController.click(sessionId, selector);
        return { success: true, selector };
      }
    },

    browser_type: {
      description: 'Type text into an input field',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          selector: { type: 'string', description: 'CSS selector of the input' },
          text: { type: 'string', description: 'Text to type' }
        },
        required: ['sessionId', 'selector', 'text']
      },
      handler: async (args: any) => {
        const { sessionId, selector, text } = args;
        await browserController.type(sessionId, selector, text);
        return { success: true, selector, text };
      }
    },

    browser_select: {
      description: 'Select an option from a dropdown',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          selector: { type: 'string', description: 'CSS selector of the select element' },
          value: { type: 'string', description: 'Value to select' }
        },
        required: ['sessionId', 'selector', 'value']
      },
      handler: async (args: any) => {
        const { sessionId, selector, value } = args;
        await browserController.selectOption(sessionId, selector, value);
        return { success: true, selector, value };
      }
    },

    browser_wait: {
      description: 'Wait for an element to appear',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          selector: { type: 'string', description: 'CSS selector to wait for' },
          timeout: { 
            type: 'number', 
            description: 'Timeout in milliseconds (default: 30000)',
            default: 30000 
          }
        },
        required: ['sessionId', 'selector']
      },
      handler: async (args: any) => {
        const { sessionId, selector, timeout = 30000 } = args;
        await browserController.waitForSelector(sessionId, selector, timeout);
        return { success: true, selector };
      }
    },

    browser_execute: {
      description: 'Execute JavaScript in the browser context',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          script: { type: 'string', description: 'JavaScript code to execute' }
        },
        required: ['sessionId', 'script']
      },
      handler: async (args: any) => {
        const { sessionId, script } = args;
        const result = await browserController.evaluate(sessionId, script);
        return { result };
      }
    },

    browser_get_text: {
      description: 'Get text content from an element',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          selector: { type: 'string', description: 'CSS selector of the element' }
        },
        required: ['sessionId', 'selector']
      },
      handler: async (args: any) => {
        const { sessionId, selector } = args;
        const text = await browserController.getText(sessionId, selector);
        return { text };
      }
    },

    browser_get_attribute: {
      description: 'Get an attribute value from an element',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          selector: { type: 'string', description: 'CSS selector of the element' },
          attribute: { type: 'string', description: 'Attribute name to get' }
        },
        required: ['sessionId', 'selector', 'attribute']
      },
      handler: async (args: any) => {
        const { sessionId, selector, attribute } = args;
        const value = await browserController.getAttribute(sessionId, selector, attribute);
        return { value };
      }
    },

    browser_get_url: {
      description: 'Get the current page URL',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' }
        },
        required: ['sessionId']
      },
      handler: async (args: any) => {
        const { sessionId } = args;
        const url = await browserController.getUrl(sessionId);
        return { url };
      }
    },

    browser_get_title: {
      description: 'Get the current page title',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' }
        },
        required: ['sessionId']
      },
      handler: async (args: any) => {
        const { sessionId } = args;
        const title = await browserController.getTitle(sessionId);
        return { title };
      }
    },

    browser_list_sessions: {
      description: 'List all active browser sessions',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const sessions = browserController.listSessions();
        return { sessions };
      }
    },

    browser_close: {
      description: 'Close a browser session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID to close' }
        },
        required: ['sessionId']
      },
      handler: async (args: any) => {
        const { sessionId } = args;
        await browserController.closeSession(sessionId);
        return { success: true, message: `Session ${sessionId} closed` };
      }
    }
  };
}