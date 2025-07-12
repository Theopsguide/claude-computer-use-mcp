# 🎭 Playwright Setup Instructions

## ✅ Status: Playwright Browser Downloaded Successfully!

The Playwright browser binaries have been installed. However, you may need to install some system dependencies for optimal performance.

---

## 🔧 **Required System Dependencies (Run These Commands)**

Open a **NEW terminal** (Windows Terminal, PowerShell, or WSL) and run:

### **Option 1: WSL/Ubuntu (Recommended)**
```bash
# Update package lists
sudo apt-get update

# Install required system libraries
sudo apt-get install -y \
  libnspr4 \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libgtk-3-0 \
  libgbm1 \
  libasound2

# Install additional dependencies for headless mode
sudo apt-get install -y \
  libxss1 \
  libgconf-2-4 \
  libxrandr2 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3

# Optional: Install full Playwright system dependencies
cd /home/luke/claude-computer-use-mcp
sudo npx playwright install-deps chromium
```

### **Option 2: Windows (Alternative)**
If WSL dependencies don't work, you can also install on Windows:

```powershell
# In PowerShell (Run as Administrator)
cd C:\Users\Luke\
npm install -g playwright
npx playwright install chromium
npx playwright install-deps chromium
```

---

## 🧪 **Test the Installation**

After installing dependencies, test the browser automation:

### **Test 1: In Claude Desktop**
Ask Claude:
```
"Launch a browser and take a screenshot of google.com"
```

### **Test 2: Manual Test**
```bash
# In WSL terminal:
cd /home/luke/claude-computer-use-mcp
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://google.com');
  console.log('✅ Browser test successful!');
  await browser.close();
})().catch(console.error);
"
```

---

## 🎯 **Expected Behavior After Setup**

When you ask Claude: *"Launch a browser and take a screenshot of google.com"*

Claude should:
1. ✅ Launch a Chromium browser instance
2. ✅ Navigate to https://google.com
3. ✅ Capture a screenshot
4. ✅ Return the screenshot as a base64 image
5. ✅ Provide session details for further automation

---

## 🚨 **Troubleshooting Common Issues**

### **Issue 1: "Chrome executable not found"**
**Solution:**
```bash
cd /home/luke/claude-computer-use-mcp
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 npx playwright install chromium
```

### **Issue 2: "libX11 not found" or similar library errors**
**Solution:**
```bash
sudo apt-get install -y \
  libx11-dev \
  libxext-dev \
  libxfixes-dev \
  libxi-dev \
  libxrandr-dev \
  libxrender-dev \
  libxss-dev \
  libxtst-dev
```

### **Issue 3: Permission errors**
**Solution:**
```bash
# Fix permissions for Playwright
chmod +x ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome
```

### **Issue 4: Headless mode issues**
**Solution:** Enable additional debugging in the MCP server:
```bash
export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
export DEBUG=pw:browser
```

---

## 🔄 **After Installing Dependencies**

1. **No need to restart Claude Desktop** - the MCP server will automatically use the new browser installation
2. **Test immediately** by asking Claude to launch a browser
3. **If still having issues**, check the logs at:
   - Claude Desktop: `C:\Users\Luke\AppData\Roaming\Claude\logs\mcp.log`
   - WSL: Run `claude mcp list` to verify server status

---

## 🎉 **Success Indicators**

✅ **Playwright installed successfully**  
✅ **System dependencies installed**  
✅ **Browser automation working**  
✅ **Screenshots capturing correctly**  
✅ **MCP server responding to browser commands**

---

## 🛡️ **Security Notes**

- Browsers run in **secure headless mode** by default
- **JavaScript execution disabled** by default (can be enabled with env var)
- **URL validation** prevents access to local files and internal networks
- **Session limits** prevent resource exhaustion
- **Automatic cleanup** after 30 minutes of inactivity

---

## 📞 **Need Help?**

If you encounter issues:

1. **Check the error logs** in Claude Desktop settings
2. **Run the manual test** provided above
3. **Verify system dependencies** are installed
4. **Try the Windows PowerShell alternative** if WSL has issues

**Current Status: Ready for testing!** 🚀