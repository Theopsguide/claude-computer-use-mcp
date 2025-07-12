// Type definitions for the claude-computer-use-mcp server

export interface BrowserLaunchArgs {
  headless?: boolean;
}

export interface NavigateArgs {
  sessionId: string;
  url: string;
}

export interface ScreenshotArgs {
  sessionId: string;
  fullPage?: boolean;
}

export interface ClickArgs {
  sessionId: string;
  selector: string;
}

export interface TypeArgs {
  sessionId: string;
  selector: string;
  text: string;
}

export interface SelectArgs {
  sessionId: string;
  selector: string;
  value: string;
}

export interface WaitArgs {
  sessionId: string;
  selector: string;
  timeout?: number;
}

export interface ExecuteArgs {
  sessionId: string;
  script: string;
}

export interface GetTextArgs {
  sessionId: string;
  selector: string;
}

export interface GetAttributeArgs {
  sessionId: string;
  selector: string;
  attribute: string;
}

export interface GetUrlArgs {
  sessionId: string;
}

export interface GetTitleArgs {
  sessionId: string;
}

export interface CloseArgs {
  sessionId: string;
}

export interface ListSessionsArgs {
  // No arguments needed
}

export interface SaveCookiesArgs {
  sessionId: string;
}

export interface LoadCookiesArgs {
  sessionId: string;
  domain?: string;
}

export interface ClearCookiesArgs {
  sessionId: string;
}

export interface GetCookiesArgs {
  sessionId: string;
  urls?: string[];
}

export interface ToolHandler<T = any, R = any> {
  description: string;
  inputSchema: unknown;
  handler: (args: T) => Promise<R>;
}

export interface BrowserTools {
  browser_launch: ToolHandler<BrowserLaunchArgs, { sessionId: string; message: string }>;
  browser_navigate: ToolHandler<NavigateArgs, { success: boolean; url: string }>;
  browser_screenshot: ToolHandler<ScreenshotArgs, { screenshot: string; mimeType: string }>;
  browser_click: ToolHandler<ClickArgs, { success: boolean; selector: string }>;
  browser_type: ToolHandler<TypeArgs, { success: boolean; selector: string; text: string }>;
  browser_select: ToolHandler<SelectArgs, { success: boolean; selector: string; value: string }>;
  browser_wait: ToolHandler<WaitArgs, { success: boolean; selector: string }>;
  browser_execute: ToolHandler<ExecuteArgs, { result: unknown }>;
  browser_get_text: ToolHandler<GetTextArgs, { text: string }>;
  browser_get_attribute: ToolHandler<GetAttributeArgs, { value: string | null }>;
  browser_get_url: ToolHandler<GetUrlArgs, { url: string }>;
  browser_get_title: ToolHandler<GetTitleArgs, { title: string }>;
  browser_list_sessions: ToolHandler<ListSessionsArgs, { sessions: Array<{ id: string; url: string; title: string; createdAt: Date }> }>;
  browser_close: ToolHandler<CloseArgs, { success: boolean; message: string }>;
  browser_save_cookies: ToolHandler<SaveCookiesArgs, { success: boolean; message: string }>;
  browser_load_cookies: ToolHandler<LoadCookiesArgs, { success: boolean; cookiesLoaded: number }>;
  browser_clear_cookies: ToolHandler<ClearCookiesArgs, { success: boolean; message: string }>;
  browser_get_cookies: ToolHandler<GetCookiesArgs, { cookies: any[] }>;
}

// Security configuration
export interface SecurityConfig {
  allowedProtocols: string[];
  maxScriptLength: number;
  maxSelectorLength: number;
  maxTextLength: number;
  maxSessions: number;
  sessionTimeout: number;
  allowJavaScriptExecution: boolean;
  // Rate limiting configuration
  maxSessionsPerMinute: number;
  maxSessionsPerHour: number;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  allowedProtocols: ['http:', 'https:'],
  maxScriptLength: 10000,
  maxSelectorLength: 500,
  maxTextLength: 50000,
  maxSessions: 10,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  allowJavaScriptExecution: false, // Disabled by default for security
  maxSessionsPerMinute: 5, // Max 5 new sessions per minute
  maxSessionsPerHour: 20, // Max 20 new sessions per hour
};