const { spawn } = require('child_process');

async function testMCPServer() {
  console.log('Testing MCP Server...\n');
  
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let responseBuffer = '';
    
    server.stderr.on('data', (data) => {
      console.log('Server log:', data.toString().trim());
    });
    
    server.stdout.on('data', (data) => {
      responseBuffer += data.toString();
      
      // Try to parse complete JSON-RPC messages
      const lines = responseBuffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line) {
          try {
            const response = JSON.parse(line);
            console.log('Response received:', JSON.stringify(response, null, 2));
            
            // Check if we got the tools list
            if (response.result && response.result.tools) {
              console.log(`\n✓ Found ${response.result.tools.length} tools:`);
              response.result.tools.forEach(tool => {
                console.log(`  - ${tool.name}: ${tool.description}`);
              });
              server.kill();
              resolve();
            }
          } catch (e) {
            console.error('Failed to parse line:', line);
          }
        }
      }
      responseBuffer = lines[lines.length - 1];
    });
    
    server.on('error', (err) => {
      console.error('Server error:', err);
      reject(err);
    });
    
    // Send tools/list request
    const request = {
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
      id: 1
    };
    
    console.log('Sending request:', JSON.stringify(request));
    server.stdin.write(JSON.stringify(request) + '\n');
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.error('\n✗ Test timed out');
      server.kill();
      reject(new Error('Timeout'));
    }, 5000);
  });
}

// Run the test
testMCPServer()
  .then(() => {
    console.log('\n✓ MCP Server test passed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ MCP Server test failed:', err.message);
    process.exit(1);
  });