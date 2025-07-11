# Claude Computer Use MCP Server

An MCP (Model Context Protocol) server that provides browser automation capabilities to Claude Code, enabling it to interact with web browsers, navigate websites, and perform UI automation tasks.

This server allows Claude Code to:
- 🌐 Launch and control web browsers programmatically
- 🔍 Navigate to websites and interact with page elements
- 📸 Take screenshots of web pages
- 📝 Extract text and data from websites
- 🤖 Execute JavaScript in browser contexts
- 🎯 Automate form filling and UI interactions

## Architecture

### Core Components

1. **MCP Server** - Handles protocol communication with Claude Code
2. **Browser Controller** - Manages Playwright browser instances
3. **Tool Suite** - Exposes browser automation capabilities as MCP tools

### Tools Provided

- `browser_launch` - Launch a new browser instance
- `browser_navigate` - Navigate to a URL
- `browser_screenshot` - Take a screenshot of the current page
- `browser_click` - Click on an element
- `browser_type` - Type text into an input field
- `browser_select` - Select from dropdown menus
- `browser_wait` - Wait for elements or conditions
- `browser_execute` - Execute JavaScript in the browser context
- `browser_get_text` - Extract text from elements
- `browser_get_attribute` - Get element attributes
- `browser_close` - Close the browser instance

### Technology Stack

- **TypeScript** - Type-safe development
- **Playwright** - Cross-browser automation
- **MCP SDK** - Model Context Protocol implementation
- **Node.js** - Runtime environment

## Prerequisites

- Node.js 18+ and npm
- Claude Code CLI installed
- Linux/macOS/WSL environment
- System dependencies for Playwright (see [Troubleshooting](#troubleshooting))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Theopsguide/claude-computer-use-mcp.git
cd claude-computer-use-mcp
```

2. Install dependencies and build:
```bash
npm install
npm run build
```

3. Install browser dependencies:
```bash
# For Chromium
npx playwright install chromium

# Install system dependencies (Linux/WSL)
sudo npx playwright install-deps chromium
```

## Configuration

Add this MCP server to your Claude Code configuration by running:

```bash
claude mcp add computer-use "node" "/home/luke/claude-computer-use-mcp/dist/index.js"
```

Or manually add to your MCP configuration:

```json
{
  "mcpServers": {
    "computer-use": {
      "command": "node",
      "args": ["/home/luke/claude-computer-use-mcp/dist/index.js"]
    }
  }
}
```

## Usage Examples

### Launch a browser and navigate to a website:
```
Use the browser_launch tool to create a new browser session
Then use browser_navigate with the sessionId to go to https://example.com
```

### Take a screenshot:
```
Use browser_screenshot with the sessionId to capture the current page
```

### Interact with page elements:
```
Use browser_click to click on buttons or links by CSS selector
Use browser_type to fill in form fields
Use browser_select to choose dropdown options
```

### Extract information:
```
Use browser_get_text to extract text from elements
Use browser_execute to run custom JavaScript
```

### Manage sessions:
```
Use browser_list_sessions to see all active browser instances
Use browser_close to clean up when done
```

## Troubleshooting

### Browser won't launch
If you get an error about missing dependencies:
```bash
sudo npx playwright install-deps
# or
sudo apt-get install libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2
```

### MCP server not found
Ensure the server is properly added to Claude Code:
```bash
claude mcp list
```

### Permission errors
Make sure the built file is executable:
```bash
chmod +x dist/index.js
```

## Development

### Running in development mode:
```bash
npm run dev  # Watch mode for TypeScript compilation
```

### Running tests:
```bash
node test-mcp-protocol.js  # Test MCP protocol
node test-browser-functionality.js  # Test browser features (requires deps)
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Luke Thompson - Owner & Chief Operations Architect at The Operations Guide