# 🤖 Claude Computer Use MCP Server

[![npm version](https://badge.fury.io/js/claude-computer-use-mcp.svg)](https://www.npmjs.com/package/claude-computer-use-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/Theopsguide/claude-computer-use-mcp)](https://github.com/Theopsguide/claude-computer-use-mcp/stargazers)

🚀 **Transform Claude into a powerful browser automation tool!** 

An MCP (Model Context Protocol) server that gives Claude the ability to control web browsers, take screenshots, navigate websites, and perform automated web tasks - all through natural conversation.

## 🎯 What Can You Do?

**Ask Claude to:**
- 📸 *"Take a screenshot of google.com"*
- 🔍 *"Navigate to reddit.com and extract the top headlines"*
- 🛒 *"Go to amazon.com and search for laptops"*
- 📊 *"Compare pricing across 3 e-commerce sites"*
- 🧪 *"Test if our website loads correctly"*
- 🎨 *"Browse design portfolios for inspiration"*

**[See 50+ Real Use Cases →](USE_CASES.md)**

---

## ⚡ Quick Install

### Option 1: NPM (Recommended)
```bash
# Install globally
npm install -g claude-computer-use-mcp

# Install browser dependencies
npx playwright install chromium

# Add to Claude Desktop (see setup guide below)
```

### Option 2: From Source
```bash
git clone https://github.com/Theopsguide/claude-computer-use-mcp.git
cd claude-computer-use-mcp
npm install && npm run build
```

## 🛠️ Setup Guide

### Step 1: Install Dependencies
```bash
# Install browser binaries
npx playwright install chromium

# Linux/WSL: Install system dependencies
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3 libatk-bridge2.0-0 libdrm2 libgtk-3-0 libgbm1
```

### Step 2: Configure Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "claude-computer-use": {
      "command": "npx",
      "args": ["claude-computer-use-mcp"]
    }
  }
}
```

**Windows with WSL:** Use this configuration instead:
```json
{
  "mcpServers": {
    "claude-computer-use": {
      "command": "wsl",
      "args": ["node", "/home/username/claude-computer-use-mcp/dist/index.js"]
    }
  }
}
```

### Step 3: Configure Claude Code (Optional)
```bash
# Global installation
claude mcp add computer-use "npx" "claude-computer-use-mcp"

# From source
claude mcp add computer-use "node" "/path/to/claude-computer-use-mcp/dist/index.js"
```

## 🚀 Quick Start

**Restart Claude Desktop** and try these commands:

```
"Launch a browser and take a screenshot of google.com"
"Navigate to github.com and extract all the repository links"  
"Go to reddit.com and tell me the top 3 headlines"
"Take screenshots of apple.com, microsoft.com, and google.com"
"Browse to hacker news and summarize the trending topics"
```

**🎉 That's it!** Claude can now control browsers through natural conversation.

## 🔧 Browser Automation Tools

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `browser_launch` | Launch browser instances | *"Launch a browser"* |
| `browser_navigate` | Navigate to URLs | *"Go to github.com"* |
| `browser_screenshot` | Capture screenshots | *"Take a screenshot"* |
| `browser_click` | Click elements | *"Click the search button"* |
| `browser_type` | Type text into inputs | *"Type 'Claude AI' in the search box"* |
| `browser_select` | Select dropdown options | *"Select 'English' from language dropdown"* |
| `browser_wait` | Wait for elements | *"Wait for the page to load"* |
| `browser_execute` | Execute JavaScript | *"Get page metrics"* |
| `browser_get_text` | Extract text content | *"Get all the headlines"* |
| `browser_get_attribute` | Get element attributes | *"Get all image URLs"* |
| `browser_get_url` | Get current URL | *"What page am I on?"* |
| `browser_get_title` | Get page title | *"What's the page title?"* |
| `browser_list_sessions` | List active sessions | *"Show my browser sessions"* |
| `browser_close` | Close browser sessions | *"Close the browser"* |

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[USE_CASES.md](USE_CASES.md)** | 50+ real-world use cases and examples |
| **[API.md](API.md)** | Complete API reference and tool specifications |
| **[EXAMPLES.md](EXAMPLES.md)** | Code examples and automation patterns |
| **[COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)** | Comprehensive installation guide |
| **[SECURITY_FIXES.md](SECURITY_FIXES.md)** | Security features and best practices |

---

## 🛡️ Security Features

✅ **Input Validation** - All inputs sanitized and validated  
✅ **URL Restrictions** - Only HTTP/HTTPS allowed, blocks internal IPs  
✅ **Session Management** - Secure session IDs with automatic cleanup  
✅ **Resource Limits** - Max 10 concurrent sessions, 30-minute timeout  
✅ **JavaScript Disabled** - By default for security (can be enabled)  

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Development Setup
```bash
git clone https://github.com/Theopsguide/claude-computer-use-mcp.git
cd claude-computer-use-mcp
npm install
npm run dev  # Watch mode for development
```

---

## 🐛 Troubleshooting

**Browser won't launch?**
- Install Playwright: `npx playwright install chromium`
- Install system deps: `sudo npx playwright install-deps chromium`

**MCP server not connecting?**
- Restart Claude Desktop completely
- Check configuration in Claude settings
- Verify the server path is correct

**Windows + WSL issues?**
- Use the WSL configuration shown in setup guide
- Ensure dependencies are installed in WSL

**More help:** Check our [complete troubleshooting guide](COMPLETE_SETUP_GUIDE.md)

---

## 📊 Requirements

- **Node.js** 18+ 
- **Claude Desktop** or **Claude Code CLI**
- **Operating System:** Windows (with WSL), macOS, or Linux
- **Browser:** Chromium (auto-installed via Playwright)

---

## ⭐ Show Your Support

If this project helps you, please give it a ⭐ on GitHub!

**Built with ❤️ by [Luke Thompson](https://github.com/Theopsguide)**

## 📄 License

MIT © Luke Thompson - see [LICENSE](LICENSE) file for details.