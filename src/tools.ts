import { BrowserController } from './browser-controller.js';
import {
  BrowserTools,
  BrowserLaunchArgs,
  NavigateArgs,
  ScreenshotArgs,
  ClickArgs,
  TypeArgs,
  SelectArgs,
  WaitArgs,
  ExecuteArgs,
  GetTextArgs,
  GetAttributeArgs,
  GetUrlArgs,
  GetTitleArgs,
  CloseArgs,
  ListSessionsArgs,
  SaveCookiesArgs,
  LoadCookiesArgs,
  ClearCookiesArgs,
  GetCookiesArgs,
  MultiTabArgs,
  SwitchTabArgs,
  CloseTabArgs,
  FormFillArgs,
  FileUploadArgs,
  FileDownloadArgs,
  AdvancedScreenshotArgs,
  ScrollArgs,
  DragDropArgs,
  WaitForNavigationArgs,
  NetworkLogsArgs,
  PerformanceMetricsArgs,
  AccessibilityArgs
} from './types.js';

// Enhanced tool interface with all new capabilities
interface EnhancedBrowserTools extends BrowserTools {
  // Multi-tab management
  browser_new_tab: any;
  browser_switch_tab: any;
  browser_close_tab: any;
  browser_list_tabs: any;
  // Form automation
  browser_fill_form: any;
  // File operations
  browser_upload_file: any;
  browser_download_file: any;
  // Advanced screenshot
  browser_advanced_screenshot: any;
  // Page interaction
  browser_scroll: any;
  browser_drag_drop: any;
  browser_wait_navigation: any;
  // Network and performance
  browser_enable_network_logging: any;
  browser_get_network_logs: any;
  browser_get_performance_metrics: any;
  // Accessibility
  browser_accessibility_audit: any;
}

export function createTools(browserController: BrowserController): EnhancedBrowserTools {
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
      handler: async (args: BrowserLaunchArgs) => {
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
      handler: async (args: NavigateArgs) => {
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
      handler: async (args: ScreenshotArgs) => {
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
      handler: async (args: ClickArgs) => {
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
      handler: async (args: TypeArgs) => {
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
      handler: async (args: SelectArgs) => {
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
      handler: async (args: WaitArgs) => {
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
      handler: async (args: ExecuteArgs) => {
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
      handler: async (args: GetTextArgs) => {
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
      handler: async (args: GetAttributeArgs) => {
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
      handler: async (args: GetUrlArgs) => {
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
      handler: async (args: GetTitleArgs) => {
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
      handler: async (_args: ListSessionsArgs) => {
        const sessions = await browserController.listSessions();
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
      handler: async (args: CloseArgs) => {
        const { sessionId } = args;
        await browserController.closeSession(sessionId);
        return { success: true, message: `Session ${sessionId} closed` };
      }
    },

    browser_save_cookies: {
      description: 'Save cookies from the current browser session to encrypted storage',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' }
        },
        required: ['sessionId']
      },
      handler: async (args: SaveCookiesArgs) => {
        const { sessionId } = args;
        await browserController.saveCookies(sessionId);
        return { success: true, message: `Cookies saved for session ${sessionId}` };
      }
    },

    browser_load_cookies: {
      description: 'Load previously saved cookies into the current browser session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          domain: { 
            type: 'string', 
            description: 'Optional: filter cookies by domain' 
          }
        },
        required: ['sessionId']
      },
      handler: async (args: LoadCookiesArgs) => {
        const { sessionId, domain } = args;
        await browserController.loadCookies(sessionId, domain);
        const cookies = await browserController.getCookies(sessionId);
        return { success: true, cookiesLoaded: cookies.length };
      }
    },

    browser_clear_cookies: {
      description: 'Clear all cookies from the browser session and storage',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' }
        },
        required: ['sessionId']
      },
      handler: async (args: ClearCookiesArgs) => {
        const { sessionId } = args;
        await browserController.clearCookies(sessionId);
        return { success: true, message: `Cookies cleared for session ${sessionId}` };
      }
    },

    browser_get_cookies: {
      description: 'Get current cookies from the browser session (without values for security)',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          urls: { 
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: filter cookies by URLs' 
          }
        },
        required: ['sessionId']
      },
      handler: async (args: GetCookiesArgs) => {
        const { sessionId, urls } = args;
        const cookies = await browserController.getCookies(sessionId, urls);
        return { cookies };
      }
    },

    // Advanced Multi-Tab Management
    browser_new_tab: {
      description: 'Create a new tab in the browser session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          url: { type: 'string', description: 'Optional URL to navigate to in the new tab' }
        },
        required: ['sessionId']
      },
      handler: async (args: MultiTabArgs) => {
        const { sessionId, url } = args;
        const result = await browserController.createNewTab(sessionId, url);
        return result;
      }
    },

    browser_switch_tab: {
      description: 'Switch to a specific tab by index',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          tabIndex: { type: 'number', description: 'Index of the tab to switch to (0-based)' }
        },
        required: ['sessionId', 'tabIndex']
      },
      handler: async (args: SwitchTabArgs) => {
        const { sessionId, tabIndex } = args;
        const result = await browserController.switchToTab(sessionId, tabIndex);
        return result;
      }
    },

    browser_close_tab: {
      description: 'Close a specific tab by index',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          tabIndex: { type: 'number', description: 'Index of the tab to close (0-based)' }
        },
        required: ['sessionId', 'tabIndex']
      },
      handler: async (args: CloseTabArgs) => {
        const { sessionId, tabIndex } = args;
        const result = await browserController.closeTab(sessionId, tabIndex);
        return result;
      }
    },

    browser_list_tabs: {
      description: 'List all tabs in the browser session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' }
        },
        required: ['sessionId']
      },
      handler: async (args: { sessionId: string }) => {
        const { sessionId } = args;
        const tabs = await browserController.listTabs(sessionId);
        return { tabs };
      }
    },

    // Form Automation
    browser_fill_form: {
      description: 'Fill multiple form fields at once and optionally submit',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          formData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                selector: { type: 'string', description: 'CSS selector for the form field' },
                value: { type: 'string', description: 'Value to enter in the field' },
                type: { 
                  type: 'string', 
                  enum: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
                  description: 'Type of input field' 
                }
              },
              required: ['selector', 'value']
            },
            description: 'Array of form fields to fill'
          },
          submitSelector: { type: 'string', description: 'Optional CSS selector for submit button' }
        },
        required: ['sessionId', 'formData']
      },
      handler: async (args: FormFillArgs) => {
        const { sessionId, formData, submitSelector } = args;
        // Convert object to array format if needed
        const formArray = Array.isArray(formData) ? formData : 
          Object.entries(formData).map(([selector, value]) => ({ selector, value }));
        const result = await browserController.fillForm(sessionId, formArray, submitSelector);
        return result;
      }
    },

    // File Operations
    browser_upload_file: {
      description: 'Upload a file through a file input element',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          fileSelector: { type: 'string', description: 'CSS selector for the file input element' },
          filePath: { type: 'string', description: 'Path to the file to upload' }
        },
        required: ['sessionId', 'fileSelector', 'filePath']
      },
      handler: async (args: FileUploadArgs) => {
        const { sessionId, fileSelector, filePath } = args;
        const result = await browserController.uploadFile(sessionId, fileSelector, filePath);
        return result;
      }
    },

    browser_download_file: {
      description: 'Download a file by clicking a download link',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          downloadSelector: { type: 'string', description: 'CSS selector for the download link/button' },
          downloadPath: { type: 'string', description: 'Optional path to save the downloaded file' }
        },
        required: ['sessionId', 'downloadSelector']
      },
      handler: async (args: FileDownloadArgs) => {
        const { sessionId, downloadSelector, downloadPath } = args;
        const result = await browserController.downloadFile(sessionId, downloadSelector, downloadPath);
        return result;
      }
    },

    // Advanced Screenshot
    browser_advanced_screenshot: {
      description: 'Take advanced screenshots with element selection, quality control, and clipping',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          element: { type: 'string', description: 'Optional CSS selector to screenshot specific element' },
          quality: { type: 'number', minimum: 1, maximum: 100, description: 'JPEG quality (1-100, default: 90)' },
          format: { type: 'string', enum: ['png', 'jpeg'], description: 'Image format (default: png)' },
          clip: {
            type: 'object',
            properties: {
              x: { type: 'number', description: 'X coordinate of clipping area' },
              y: { type: 'number', description: 'Y coordinate of clipping area' },
              width: { type: 'number', description: 'Width of clipping area' },
              height: { type: 'number', description: 'Height of clipping area' }
            },
            required: ['x', 'y', 'width', 'height'],
            description: 'Optional clipping rectangle'
          }
        },
        required: ['sessionId']
      },
      handler: async (args: AdvancedScreenshotArgs) => {
        const { sessionId, element, quality, format, clip } = args;
        const result = await browserController.takeAdvancedScreenshot(sessionId, {
          element, quality, format, clip
        });
        return result;
      }
    },

    // Page Interaction
    browser_scroll: {
      description: 'Scroll the page in a specific direction',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          direction: { 
            type: 'string', 
            enum: ['up', 'down', 'left', 'right'],
            description: 'Direction to scroll' 
          },
          distance: { type: 'number', description: 'Distance to scroll in pixels (default: 500)' }
        },
        required: ['sessionId', 'direction']
      },
      handler: async (args: ScrollArgs) => {
        const { sessionId, direction, distance } = args;
        const result = await browserController.scroll(sessionId, direction, distance);
        return result;
      }
    },

    browser_drag_drop: {
      description: 'Drag and drop an element to another element',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          sourceSelector: { type: 'string', description: 'CSS selector for the element to drag' },
          targetSelector: { type: 'string', description: 'CSS selector for the drop target' }
        },
        required: ['sessionId', 'sourceSelector', 'targetSelector']
      },
      handler: async (args: DragDropArgs) => {
        const { sessionId, sourceSelector, targetSelector } = args;
        const result = await browserController.dragAndDrop(sessionId, sourceSelector, targetSelector);
        return result;
      }
    },

    browser_wait_navigation: {
      description: 'Wait for page navigation to complete',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          timeout: { type: 'number', description: 'Timeout in milliseconds (default: 30000)' },
          waitUntil: {
            type: 'string',
            enum: ['load', 'domcontentloaded', 'networkidle'],
            description: 'When to consider navigation finished (default: load)'
          }
        },
        required: ['sessionId']
      },
      handler: async (args: WaitForNavigationArgs) => {
        const { sessionId, timeout, waitUntil } = args;
        const result = await browserController.waitForNavigation(sessionId, timeout, waitUntil);
        return result;
      }
    },

    // Network and Performance
    browser_enable_network_logging: {
      description: 'Enable network request logging for the session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' }
        },
        required: ['sessionId']
      },
      handler: async (args: { sessionId: string }) => {
        const { sessionId } = args;
        const result = await browserController.enableNetworkLogging(sessionId);
        return result;
      }
    },

    browser_get_network_logs: {
      description: 'Get network request logs for the session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          includeHeaders: { type: 'boolean', description: 'Include request/response headers (default: false)' }
        },
        required: ['sessionId']
      },
      handler: async (args: NetworkLogsArgs) => {
        const { sessionId, includeHeaders } = args;
        const logs = await browserController.getNetworkLogs(sessionId, includeHeaders);
        return { logs };
      }
    },

    browser_get_performance_metrics: {
      description: 'Get performance metrics for the current page',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' }
        },
        required: ['sessionId']
      },
      handler: async (args: PerformanceMetricsArgs) => {
        const { sessionId } = args;
        const metrics = await browserController.getPerformanceMetrics(sessionId);
        return { metrics };
      }
    },

    // Accessibility
    browser_accessibility_audit: {
      description: 'Run accessibility audit on the page or specific element',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Browser session ID' },
          selector: { type: 'string', description: 'Optional CSS selector to audit specific element' }
        },
        required: ['sessionId']
      },
      handler: async (args: AccessibilityArgs) => {
        const { sessionId, selector } = args;
        const audit = await browserController.runAccessibilityAudit(sessionId, selector);
        return { audit };
      }
    }
  };
}