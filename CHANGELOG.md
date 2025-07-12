# Changelog

All notable changes to the Claude Computer Use MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-11

### Added
- Initial release of Claude Computer Use MCP Server
- 14 browser automation tools:
  - `browser_launch` - Launch browser instances
  - `browser_navigate` - Navigate to URLs
  - `browser_screenshot` - Capture screenshots
  - `browser_click` - Click elements
  - `browser_type` - Type text into inputs
  - `browser_select` - Select dropdown options
  - `browser_wait` - Wait for elements
  - `browser_execute` - Execute JavaScript
  - `browser_get_text` - Extract text content
  - `browser_get_attribute` - Get element attributes
  - `browser_get_url` - Get current URL
  - `browser_get_title` - Get page title
  - `browser_list_sessions` - List active sessions
  - `browser_close` - Close browser sessions
- Full MCP protocol implementation
- TypeScript support with strict typing
- Playwright integration for cross-browser support
- Comprehensive documentation:
  - API reference
  - Usage examples
  - Testing guide
  - Contributing guidelines
- Test suite for MCP protocol validation
- Session management for multiple browser instances
- Error handling and validation
- Base64 screenshot encoding
- Headless and headed browser modes

### Technical Details
- Built with TypeScript and Node.js
- Uses Playwright for browser automation
- Implements MCP SDK for Claude Code integration
- Supports stdio transport for local execution

### Known Issues
- Requires system dependencies for Playwright browsers
- Browser functionality needs `sudo npx playwright install-deps` on Linux/WSL

## [1.1.0] - 2025-01-11

### Security Enhancements
- **CRITICAL**: Disabled arbitrary JavaScript execution by default (CVE pending)
- Added comprehensive input validation for all user inputs
- Implemented URL validation to prevent navigation to local files and internal IPs
- Added CSS selector validation to prevent XSS attacks
- Introduced configurable security policies via environment variables
- Replaced predictable sequential session IDs with cryptographically secure random IDs

### Added
- New type definitions file (`types.ts`) with complete TypeScript interfaces
- Input validation module (`validation.ts`) with security-focused validators
- Configuration module (`config.ts`) with environment variable support
- Session timeout and automatic cleanup (30-minute default)
- Maximum session limit to prevent resource exhaustion (10 sessions default)
- Rate limiting for session creation
- Enhanced error handling for all async operations
- Process-level error handlers for uncaught exceptions and rejections

### Changed
- **BREAKING**: JavaScript execution via `browser_execute` now disabled by default
  - Enable with `ALLOW_JAVASCRIPT_EXECUTION=true` environment variable
- **BREAKING**: `listSessions()` is now async and returns actual page titles
- Replaced all `any` types with proper TypeScript interfaces
- Updated browser launch arguments for better security
- Enhanced error messages with more context
- Improved browser context security headers

### Fixed
- Memory leaks from unclosed browser sessions on errors
- Missing error handling in all async functions
- Type safety issues throughout the codebase
- Potential null reference errors
- Race conditions in session management
- Missing await for async listSessions call

### Environment Variables
- `ALLOW_JAVASCRIPT_EXECUTION` - Enable JavaScript execution (default: false)
- `MAX_SESSIONS` - Maximum concurrent sessions (default: 10, max: 100)
- `SESSION_TIMEOUT` - Session timeout in milliseconds (default: 1800000, max: 3600000)

## [Unreleased]

### Planned Features
- Additional browser control tools (scroll, hover, drag-and-drop)
- Cookie and storage management
- Network request interception
- PDF generation from pages
- Video recording capabilities
- Multi-browser support (Firefox, Safari)
- Remote browser support
- Performance metrics collection

---

For more details, see the [GitHub releases](https://github.com/lukethompson/claude-computer-use-mcp/releases).