import { DEFAULT_SECURITY_CONFIG, SecurityConfig } from './types.js';

// Performance optimization: cache compiled regex patterns
const DANGEROUS_SCRIPT_PATTERNS = [
  /require\s*\(/i,
  /import\s+/i,
  /eval\s*\(/i,
  /Function\s*\(/i,
  /setTimeout\s*\(/i,
  /setInterval\s*\(/i,
  /XMLHttpRequest/i,
  /fetch\s*\(/i,
  /\.constructor\s*\(/i,
  /__proto__/i,
  /process\./i,
  /child_process/i,
  /fs\./i,
  /readFile/i,
  /writeFile/i,
];

// Cached regex for session ID validation
const SESSION_ID_PATTERN = /^session-[a-f0-9]{32}$/;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export function validateUrl(url: string, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): void {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL must be a non-empty string');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new ValidationError(`Invalid URL format: ${url}`);
  }

  if (!config.allowedProtocols.includes(parsedUrl.protocol)) {
    throw new SecurityError(
      `Protocol '${parsedUrl.protocol}' not allowed. Allowed protocols: ${config.allowedProtocols.join(', ')}`
    );
  }

  // Prevent navigation to local files
  if (parsedUrl.protocol === 'file:') {
    throw new SecurityError('Navigation to local files is not allowed');
  }

  // Prevent navigation to internal IPs and loopback addresses
  const hostname = parsedUrl.hostname;
  
  // Check for localhost variations
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new SecurityError('Navigation to localhost is not allowed');
  }
  
  // Check if hostname is an IP address
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Pattern);
  
  if (match) {
    const [, a, b, c, d] = match.map(Number);
    
    // Validate IP octets
    if ([a, b, c, d].some(octet => octet > 255)) {
      throw new ValidationError('Invalid IP address');
    }
    
    // Check for loopback (127.0.0.0/8)
    if (a === 127) {
      throw new SecurityError('Navigation to loopback addresses is not allowed');
    }
    
    // Check for private IP ranges (RFC1918)
    // 10.0.0.0/8
    if (a === 10) {
      throw new SecurityError('Navigation to private IP addresses (10.0.0.0/8) is not allowed');
    }
    
    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) {
      throw new SecurityError('Navigation to private IP addresses (172.16.0.0/12) is not allowed');
    }
    
    // 192.168.0.0/16
    if (a === 192 && b === 168) {
      throw new SecurityError('Navigation to private IP addresses (192.168.0.0/16) is not allowed');
    }
    
    // Link-local addresses (169.254.0.0/16)
    if (a === 169 && b === 254) {
      throw new SecurityError('Navigation to link-local addresses is not allowed');
    }
  }
  
  // Check for IPv6 loopback and private addresses
  if (hostname === '::1' || hostname.startsWith('fe80:') || hostname.startsWith('fc00:') || hostname.startsWith('fd00:')) {
    throw new SecurityError('Navigation to private IPv6 addresses is not allowed');
  }
}

export function validateSelector(selector: string, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): void {
  if (!selector || typeof selector !== 'string') {
    throw new ValidationError('Selector must be a non-empty string');
  }

  if (selector.length > config.maxSelectorLength) {
    throw new ValidationError(`Selector too long (max ${config.maxSelectorLength} characters)`);
  }

  // Basic XSS prevention
  if (selector.includes('<script') || selector.includes('javascript:')) {
    throw new SecurityError('Selector contains potentially malicious content');
  }
}

export function validateText(text: string, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): void {
  if (typeof text !== 'string') {
    throw new ValidationError('Text must be a string');
  }

  if (text.length > config.maxTextLength) {
    throw new ValidationError(`Text too long (max ${config.maxTextLength} characters)`);
  }
}

export function validateScript(script: string, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): void {
  if (!config.allowJavaScriptExecution) {
    throw new SecurityError('JavaScript execution is disabled for security reasons');
  }

  if (!script || typeof script !== 'string') {
    throw new ValidationError('Script must be a non-empty string');
  }

  if (script.length > config.maxScriptLength) {
    throw new ValidationError(`Script too long (max ${config.maxScriptLength} characters)`);
  }

  // Basic security checks - these are not comprehensive but catch obvious issues
  for (const pattern of DANGEROUS_SCRIPT_PATTERNS) {
    if (pattern.test(script)) {
      throw new SecurityError(`Script contains potentially dangerous pattern: ${pattern}`);
    }
  }
}

export function validateSessionId(sessionId: string): void {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('Session ID must be a non-empty string');
  }

  // Session IDs should match our expected format (session-[32 hex chars])
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    throw new ValidationError('Invalid session ID format');
  }
}

export function validateTimeout(timeout: number | undefined): number {
  if (timeout === undefined) {
    return 30000; // Default 30 seconds
  }

  if (typeof timeout !== 'number' || isNaN(timeout)) {
    throw new ValidationError('Timeout must be a number');
  }

  if (timeout < 0) {
    throw new ValidationError('Timeout must be non-negative');
  }

  if (timeout > 300000) { // Max 5 minutes
    throw new ValidationError('Timeout too large (max 5 minutes)');
  }

  return timeout;
}

export function validateAttribute(attribute: string): void {
  if (!attribute || typeof attribute !== 'string') {
    throw new ValidationError('Attribute must be a non-empty string');
  }

  if (attribute.length > 100) {
    throw new ValidationError('Attribute name too long');
  }

  // Only allow alphanumeric, dash, and data- attributes
  if (!/^[a-zA-Z0-9-]+$/.test(attribute)) {
    throw new ValidationError('Invalid attribute name');
  }
}