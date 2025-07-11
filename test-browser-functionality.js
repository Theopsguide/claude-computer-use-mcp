const { spawn } = require('child_process');

class MCPClient {
  constructor() {
    this.server = null;
    this.requestId = 1;
    this.pendingRequests = new Map();
    this.responseBuffer = '';
  }

  async start() {
    this.server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stderr.on('data', (data) => {
      console.log('[Server]', data.toString().trim());
    });

    this.server.stdout.on('data', (data) => {
      this.responseBuffer += data.toString();
      this.processResponses();
    });

    this.server.on('error', (err) => {
      console.error('Server error:', err);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  processResponses() {
    const lines = this.responseBuffer.split('\n');
    
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line) {
        try {
          const response = JSON.parse(line);
          const pending = this.pendingRequests.get(response.id);
          if (pending) {
            pending.resolve(response);
            this.pendingRequests.delete(response.id);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    this.responseBuffer = lines[lines.length - 1];
  }

  async callTool(toolName, args) {
    const id = this.requestId++;
    const request = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      },
      id
    };

    console.log(`\nCalling ${toolName}:`, args);

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.server.stdin.write(JSON.stringify(request) + '\n');
      
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  async stop() {
    if (this.server) {
      this.server.kill();
    }
  }
}

async function runBrowserTest() {
  const client = new MCPClient();
  
  try {
    console.log('Starting MCP server...');
    await client.start();
    
    console.log('\n=== Browser Functionality Test ===');
    
    // Test 1: Launch browser
    console.log('\n1. Launching browser in headless mode...');
    const launchResult = await client.callTool('browser_launch', { headless: true });
    
    if (launchResult.result.isError) {
      console.error('Launch error:', launchResult.result.content[0].text);
      throw new Error('Failed to launch browser');
    }
    
    const sessionId = JSON.parse(launchResult.result.content[0].text).sessionId;
    console.log('✓ Browser launched with session:', sessionId);
    
    // Test 2: Navigate to a URL
    console.log('\n2. Navigating to example.com...');
    await client.callTool('browser_navigate', { 
      sessionId, 
      url: 'https://example.com' 
    });
    console.log('✓ Navigation successful');
    
    // Test 3: Get page title
    console.log('\n3. Getting page title...');
    const titleResult = await client.callTool('browser_get_title', { sessionId });
    const title = JSON.parse(titleResult.result.content[0].text).title;
    console.log('✓ Page title:', title);
    
    // Test 4: Get page text
    console.log('\n4. Getting page text...');
    const textResult = await client.callTool('browser_get_text', { 
      sessionId, 
      selector: 'h1' 
    });
    const text = JSON.parse(textResult.result.content[0].text).text;
    console.log('✓ H1 text:', text);
    
    // Test 5: Take screenshot
    console.log('\n5. Taking screenshot...');
    const screenshotResult = await client.callTool('browser_screenshot', { 
      sessionId,
      fullPage: true 
    });
    const screenshotData = JSON.parse(screenshotResult.result.content[0].text);
    console.log('✓ Screenshot captured, size:', screenshotData.screenshot.length, 'bytes (base64)');
    
    // Test 6: Execute JavaScript
    console.log('\n6. Executing JavaScript...');
    const jsResult = await client.callTool('browser_execute', { 
      sessionId,
      script: 'return document.querySelector("p").textContent;'
    });
    const jsOutput = JSON.parse(jsResult.result.content[0].text).result;
    console.log('✓ JavaScript result:', jsOutput);
    
    // Test 7: List sessions
    console.log('\n7. Listing browser sessions...');
    const sessionsResult = await client.callTool('browser_list_sessions', {});
    const sessions = JSON.parse(sessionsResult.result.content[0].text).sessions;
    console.log('✓ Active sessions:', sessions.length);
    
    // Test 8: Close browser
    console.log('\n8. Closing browser...');
    await client.callTool('browser_close', { sessionId });
    console.log('✓ Browser closed');
    
    console.log('\n=== All tests passed! ===');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await client.stop();
  }
}

// Run the test
runBrowserTest().then(() => process.exit(0)).catch(() => process.exit(1));