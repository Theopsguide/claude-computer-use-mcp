# Claude Computer Use MCP Server

An MCP (Model Context Protocol) server that provides browser automation capabilities to Claude Code, enabling it to interact with web browsers, navigate websites, and perform UI automation tasks.

## Installation

### Option 1: Install from npm (Recommended)

```bash
# Install globally
npm install -g claude-computer-use-mcp

# Or install locally in your project
npm install claude-computer-use-mcp
```

### Option 2: Install from source

```bash
git clone https://github.com/Theopsguide/claude-computer-use-mcp.git
cd claude-computer-use-mcp
npm install
npm run build
```

## Setup

1. Install browser dependencies:
```bash
# Install Chromium browser
npx playwright install chromium

# Install system dependencies (Linux/WSL)
sudo npx playwright install-deps chromium
```

2. Add to Claude Code:

If installed globally:
```bash
claude mcp add computer-use "claude-computer-use-mcp"
```

If installed locally:
```bash
claude mcp add computer-use "npx" "claude-computer-use-mcp"
```

If installed from source:
```bash
claude mcp add computer-use "node" "/path/to/claude-computer-use-mcp/dist/index.js"
```

## Quick Start

Once configured, you can ask Claude Code to:

- "Launch a browser and navigate to example.com"
- "Take a screenshot of the current page"
- "Click the login button and fill in the form"
- "Extract all the links from the page"
- "Execute JavaScript to get page metrics"

## Available Tools

- `browser_launch` - Launch browser instances
- `browser_navigate` - Navigate to URLs
- `browser_screenshot` - Capture screenshots
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_select` - Select dropdown options
- `browser_wait` - Wait for elements
- `browser_execute` - Execute JavaScript
- `browser_get_text` - Extract text
- `browser_get_attribute` - Get element attributes
- `browser_get_url` - Get current URL
- `browser_get_title` - Get page title
- `browser_list_sessions` - List active sessions
- `browser_close` - Close browser sessions

## Documentation

- [API Reference](https://github.com/Theopsguide/claude-computer-use-mcp/blob/main/API.md)
- [Usage Examples](https://github.com/Theopsguide/claude-computer-use-mcp/blob/main/EXAMPLES.md)
- [Full Documentation](https://github.com/Theopsguide/claude-computer-use-mcp#readme)

## Requirements

- Node.js 18+
- Claude Code CLI
- Linux/macOS/WSL environment

## License

MIT © Luke Thompson