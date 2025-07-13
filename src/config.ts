import { SecurityConfig, LogLevel, EnterpriseConfig } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

// Enhanced security configuration with enterprise features
export const SECURITY_CONFIG: SecurityConfig = {
  // Only allow HTTP and HTTPS protocols
  allowedProtocols: ['http:', 'https:'],
  
  // Script execution limits
  maxScriptLength: 10000, // 10KB max script size
  allowJavaScriptExecution: false, // Disabled by default for security
  
  // Input validation limits
  maxSelectorLength: 500, // Max CSS selector length
  maxTextLength: 50000, // 50KB max text input
  
  // Session management
  maxSessions: 10, // Max concurrent browser sessions
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  
  // Rate limiting
  maxSessionsPerMinute: 5, // Max 5 new sessions per minute
  maxSessionsPerHour: 20, // Max 20 new sessions per hour
  
  // Enhanced security features
  enableContentSecurityPolicy: true,
  enableRequestInterception: true,
  blockedDomains: ['localhost', '127.0.0.1', '0.0.0.0'],
  allowedFileExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.txt', '.csv'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  enableAuditLogging: true,
  enableMetrics: true,
  sandboxMode: true
};

// Enterprise configuration
export const ENTERPRISE_CONFIG: EnterpriseConfig = {
  enableDocker: false,
  enableKubernetes: false,
  enableCluster: false,
  enableLoadBalancer: false,
  enableHealthChecks: true,
  enableMetrics: true,
  enableTracing: false,
  logLevel: 'info' as LogLevel,
  metricsPort: 9090,
  healthCheckPort: 8080,
  configReloadInterval: 60000, // 1 minute
  enableConfigWatch: true
};

// Load configuration from external file if available
function loadConfigFromFile(): Partial<SecurityConfig & EnterpriseConfig> {
  const configPaths = [
    './claude-computer-use-config.json',
    './config/security.json',
    process.env.CONFIG_PATH
  ].filter(Boolean);

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath!)) {
        const content = fs.readFileSync(configPath!, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}:`, error);
    }
  }
  
  return {};
}

// Apply configuration overrides
const configOverrides = loadConfigFromFile();
Object.assign(SECURITY_CONFIG, configOverrides);
Object.assign(ENTERPRISE_CONFIG, configOverrides);

// Allow environment variable overrides for configuration
// SECURITY: JavaScript execution is disabled by default and strongly discouraged
if (process.env.ALLOW_JAVASCRIPT_EXECUTION === 'true' && process.env.I_UNDERSTAND_THE_SECURITY_RISKS === 'true') {
  console.error('⚠️  WARNING: JavaScript execution is ENABLED. This poses SEVERE SECURITY RISKS!');
  console.error('⚠️  This allows arbitrary code execution in the browser context.');
  console.error('⚠️  Only enable this if you fully understand and accept the risks.');
  SECURITY_CONFIG.allowJavaScriptExecution = true;
}

if (process.env.MAX_SESSIONS) {
  const maxSessions = parseInt(process.env.MAX_SESSIONS, 10);
  if (!isNaN(maxSessions) && maxSessions > 0 && maxSessions <= 100) {
    SECURITY_CONFIG.maxSessions = maxSessions;
  }
}

if (process.env.SESSION_TIMEOUT) {
  const timeout = parseInt(process.env.SESSION_TIMEOUT, 10);
  if (!isNaN(timeout) && timeout > 0 && timeout <= 3600000) { // Max 1 hour
    SECURITY_CONFIG.sessionTimeout = timeout;
  }
}