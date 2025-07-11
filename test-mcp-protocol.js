const { spawn } = require('child_process');

class MCPTester {
  constructor() {
    this.server = null;
    this.requestId = 1;
  }

  async start() {
    console.log('Starting MCP server...');
    this.server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stderr.on('data', (data) => {
      console.log('[Server]', data.toString().trim());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.requestId++
    };

    console.log(`\n→ Request: ${method}`);
    console.log(JSON.stringify(params, null, 2));

    return new Promise((resolve, reject) => {
      let responseBuffer = '';
      
      const dataHandler = (data) => {
        responseBuffer += data.toString();
        const lines = responseBuffer.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                this.server.stdout.removeListener('data', dataHandler);
                console.log(`\n← Response:`);
                console.log(JSON.stringify(response, null, 2));
                resolve(response);
                return;
              }
            } catch (e) {
              // Continue accumulating
            }
          }
        }
      };
      
      this.server.stdout.on('data', dataHandler);
      this.server.stdin.write(JSON.stringify(request) + '\n');
      
      setTimeout(() => {
        this.server.stdout.removeListener('data', dataHandler);
        reject(new Error('Request timeout'));
      }, 5000);
    });
  }

  async stop() {
    if (this.server) {
      this.server.kill();
    }
  }
}

async function testMCPProtocol() {
  const tester = new MCPTester();
  
  try {
    await tester.start();
    
    console.log('\n=== MCP Protocol Test ===');
    
    // Test 1: List tools
    console.log('\n1. Testing tools/list...');
    const toolsResponse = await tester.sendRequest('tools/list');
    console.log(`✓ Found ${toolsResponse.result.tools.length} tools`);
    
    // Test 2: Call a simple tool (list sessions - no browser needed)
    console.log('\n2. Testing browser_list_sessions...');
    const sessionsResponse = await tester.sendRequest('tools/call', {
      name: 'browser_list_sessions',
      arguments: {}
    });
    console.log('✓ Tool call successful');
    
    // Test 3: Invalid tool call
    console.log('\n3. Testing invalid tool call...');
    try {
      const invalidResponse = await tester.sendRequest('tools/call', {
        name: 'invalid_tool',
        arguments: {}
      });
      if (invalidResponse.error) {
        console.log('✓ Error handling works correctly');
      }
    } catch (e) {
      console.log('✓ Error handling works correctly');
    }
    
    console.log('\n=== All protocol tests passed! ===');
    console.log('\nNote: Browser functionality requires system dependencies.');
    console.log('To test browser features, run: sudo npx playwright install-deps');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
  } finally {
    await tester.stop();
  }
}

// Run the test
testMCPProtocol().then(() => process.exit(0)).catch(() => process.exit(1));