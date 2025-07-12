# Cookie Management Feature

## Overview

The claude-computer-use-mcp tool now includes a secure cookie management system that allows you to save, load, and manage browser cookies across sessions. This feature enables persistent authentication and session management for automated browser tasks.

## Security Features

- **AES-256-GCM Encryption**: All cookie values are encrypted using military-grade encryption
- **Secure File Permissions**: Cookie storage uses restrictive file permissions (700 for directories, 600 for files)
- **No Plaintext Storage**: Sensitive cookie values are never stored in plaintext
- **Session Isolation**: Cookies are stored separately by session ID
- **Domain Organization**: Cookies are organized by domain for efficient loading

## Available Cookie Tools

### 1. browser_save_cookies
Save all cookies from the current browser session to encrypted storage.

```json
{
  "tool": "browser_save_cookies",
  "arguments": {
    "sessionId": "session-abc123"
  }
}
```

### 2. browser_load_cookies
Load previously saved cookies into the current browser session.

```json
{
  "tool": "browser_load_cookies",
  "arguments": {
    "sessionId": "session-abc123",
    "domain": "example.com"  // Optional: filter by domain
  }
}
```

### 3. browser_clear_cookies
Clear all cookies from both the browser session and storage.

```json
{
  "tool": "browser_clear_cookies",
  "arguments": {
    "sessionId": "session-abc123"
  }
}
```

### 4. browser_get_cookies
Get cookie metadata (without values for security).

```json
{
  "tool": "browser_get_cookies",
  "arguments": {
    "sessionId": "session-abc123",
    "urls": ["https://example.com"]  // Optional: filter by URLs
  }
}
```

## Usage Examples

### Example 1: Login Persistence
```javascript
// 1. Create session and login
const sessionId = await browserLaunch();
await browserNavigate(sessionId, "https://example.com/login");
await browserType(sessionId, "#username", "myuser");
await browserType(sessionId, "#password", "mypass");
await browserClick(sessionId, "#login-button");

// 2. Save cookies after login
await browserSaveCookies(sessionId);

// 3. Later, in a new session...
const newSessionId = await browserLaunch();
await browserLoadCookies(newSessionId, "example.com");
await browserNavigate(newSessionId, "https://example.com/dashboard");
// User is already logged in!
```

### Example 2: Multi-Domain Cookie Management
```javascript
// Visit multiple sites and save their cookies
await browserNavigate(sessionId, "https://site1.com");
// ... perform actions ...
await browserSaveCookies(sessionId);

await browserNavigate(sessionId, "https://site2.com");
// ... perform actions ...
await browserSaveCookies(sessionId);

// Load cookies for specific domain only
await browserLoadCookies(sessionId, "site1.com");
```

## Configuration

### Environment Variables

- `COOKIE_ENCRYPTION_KEY`: Set this to enable cookie encryption. If not set, cookies will be stored without encryption (not recommended).

Example:
```bash
export COOKIE_ENCRYPTION_KEY="your-32-character-secret-key-here"
```

### Storage Location

Cookies are stored in the `.cookie-storage` directory relative to the working directory. The structure is:

```
.cookie-storage/
├── session-abc123/
│   ├── example_com.json
│   └── another-site_com.json
└── session-xyz789/
    └── example_com.json
```

## Security Best Practices

1. **Always Set Encryption Key**: Set the `COOKIE_ENCRYPTION_KEY` environment variable in production
2. **Regular Cleanup**: Periodically clear old cookie storage to prevent accumulation
3. **Session Isolation**: Use different session IDs for different tasks/users
4. **Minimal Permissions**: The tool automatically sets restrictive file permissions
5. **No Value Exposure**: The `browser_get_cookies` tool never returns actual cookie values

## Troubleshooting

### Issue: Cookies not persisting
- Ensure the website's cookies don't have `sessionOnly` flag
- Check that cookies haven't expired
- Verify encryption key is consistent between save and load

### Issue: Permission denied errors
- Check that the process has write permissions to the working directory
- Ensure no other process is accessing the cookie storage

### Issue: Cookies not loading
- Verify the session ID matches between save and load
- Check that the domain filter (if used) matches the saved cookies
- Ensure the encryption key hasn't changed

## Future Enhancements

1. **Browser Import**: Import cookies from system browsers (Chrome, Firefox, etc.)
2. **Cookie Editing**: Modify cookie attributes before loading
3. **Expiration Management**: Automatic cleanup of expired cookies
4. **Cookie Profiles**: Named cookie profiles for different use cases

## Example Integration with Claude

When using with Claude Code, you can:

1. Save login sessions for repeated tasks
2. Maintain authentication across multiple automation runs
3. Test websites with different cookie states
4. Manage multiple user sessions simultaneously

The cookie management system integrates seamlessly with all existing browser automation tools, providing a complete solution for stateful web automation.