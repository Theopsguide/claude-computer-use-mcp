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