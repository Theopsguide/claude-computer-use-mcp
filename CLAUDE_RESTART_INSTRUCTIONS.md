# 🚀 Claude Desktop Restart Instructions

## ⚠️ Important: Full Restart Required

Claude Desktop needs to be **completely restarted** to load the new `claude-computer-use` MCP server.

---

## 📋 Step-by-Step Instructions:

### 1. **Close Claude Desktop Completely**
   - ❌ **NOT ENOUGH:** Just closing the chat window
   - ✅ **REQUIRED:** Complete application shutdown
   
   **Windows:**
   - Right-click Claude in system tray → "Quit" 
   - OR use Task Manager to end Claude process
   - OR press `Alt+F4` when Claude window is active

### 2. **Wait 10 seconds**
   - Let all processes fully terminate
   - This ensures clean restart

### 3. **Reopen Claude Desktop**
   - Launch from Start Menu or Desktop shortcut
   - Wait for complete startup

### 4. **Test the Installation**
   Try asking Claude:
   ```
   "Launch a browser and take a screenshot of google.com"
   ```

---

## ✅ Success Indicators:

If working correctly, Claude should:
- ✅ Launch a browser instance
- ✅ Navigate to google.com  
- ✅ Capture and return a screenshot
- ✅ Respond with browser session details

## ❌ If Still Not Working:

### Option A: Manual Configuration Check
1. Open Claude Desktop Settings
2. Look for MCP servers section
3. Verify `claude-computer-use` is listed and enabled

### Option B: Alternative Configuration
If npm global install doesn't work, try local path method:

1. Copy the project to Windows:
   ```powershell
   # In PowerShell/Command Prompt:
   xcopy "\\wsl$\Ubuntu\home\luke\claude-computer-use-mcp" "C:\Users\Luke\claude-computer-use-mcp" /E /I
   cd "C:\Users\Luke\claude-computer-use-mcp"
   npm install
   npm run build
   ```

2. Update Claude Desktop config at:
   `C:\Users\Luke\AppData\Roaming\Claude\claude_desktop_config.json`
   
   Change:
   ```json
   "claude-computer-use": {
     "command": "npx",
     "args": ["claude-computer-use-mcp"]
   }
   ```
   
   To:
   ```json
   "claude-computer-use": {
     "command": "node",
     "args": ["C:\\Users\\Luke\\claude-computer-use-mcp\\dist\\index.js"]
   }
   ```

### Option C: Install Playwright Dependencies
If browser launch fails:
```bash
# In WSL or PowerShell:
npx playwright install chromium
npx playwright install-deps chromium  # Linux/WSL only
```

---

## 🔍 Troubleshooting Commands:

### Check MCP Server Status:
```bash
# In WSL/Claude Code:
claude mcp list
```

### Check Claude Desktop Logs:
Look at: `C:\Users\Luke\AppData\Roaming\Claude\logs\mcp.log`

### Test Server Manually:
```bash
# In WSL:
cd /home/luke/claude-computer-use-mcp
node dist/index.js
# Should show: "Claude Computer Use MCP Server started"
```

---

## 🎯 Expected Behavior After Restart:

When you ask: *"Launch a browser and take a screenshot of google.com"*

Claude should respond with something like:
```
I'll launch a browser and take a screenshot of google.com for you.

*uses browser_launch tool*
*uses browser_navigate tool with url: "https://google.com"*  
*uses browser_screenshot tool*

Here's the screenshot of google.com: [displays image]

The browser session has been created successfully. You can continue to use it for more automation tasks or I can close it when you're done.
```

---

**🔄 RESTART CLAUDE DESKTOP NOW TO ACTIVATE BROWSER AUTOMATION! 🔄**