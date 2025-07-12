# 🎭 Windows Playwright Setup Fix

## 🔍 **Issue Identified:**
Claude Desktop is running on Windows and trying to access Playwright there, but we only installed Playwright in WSL.

## ✅ **Solution Applied:**
Updated Claude Desktop configuration to use WSL for browser automation.

---

## 🔧 **Configuration Change:**

**Changed from:**
```json
"claude-computer-use": {
  "command": "npx",
  "args": ["claude-computer-use-mcp"]
}
```

**Changed to:**
```json
"claude-computer-use": {
  "command": "wsl",
  "args": ["node", "/home/luke/claude-computer-use-mcp/dist/index.js"]
}
```

This tells Claude Desktop to run the MCP server through WSL where Playwright is properly installed.

---

## 🔄 **Next Steps:**

1. **Restart Claude Desktop completely**
   - Close Claude Desktop entirely
   - Wait 10 seconds  
   - Reopen Claude Desktop

2. **Test browser automation:**
   ```
   "Launch a browser and take a screenshot of google.com"
   ```

---

## 🎯 **Alternative: Install Playwright on Windows**

If WSL approach doesn't work, you can install Playwright directly on Windows:

### **Option A: PowerShell (Run as Administrator)**
```powershell
cd C:\Users\Luke
npm install -g playwright
npx playwright install chromium
```

### **Option B: Command Prompt**
```cmd
cd C:\Users\Luke
npm install playwright
npx playwright install
```

Then change config back to:
```json
"claude-computer-use": {
  "command": "npx",
  "args": ["claude-computer-use-mcp"]
}
```

---

## 🎉 **Expected Behavior After Restart:**

Claude should:
- ✅ Launch browser successfully
- ✅ Navigate to google.com
- ✅ Capture screenshot
- ✅ Return image in chat

---

**🔄 RESTART CLAUDE DESKTOP NOW TO APPLY THE WSL CONFIGURATION! 🔄**