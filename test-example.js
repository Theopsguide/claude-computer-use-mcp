// Test script to verify the MCP server is working correctly
const { spawn } = require('child_process');

async function testMCPServer() {
  console.log('Starting MCP server test...');
  
  // Start the MCP server
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Handle server output
  server.stderr.on('data', (data) => {
    console.log('Server:', data.toString());
  });
  
  // Send list tools request
  const listToolsRequest = {
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 1
  };
  
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Read response
  server.stdout.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      console.log('Response:', JSON.stringify(response, null, 2));
      
      // Close the server after getting response
      server.kill();
      process.exit(0);
    } catch (e) {
      console.error('Failed to parse response:', e);
    }
  });
  
  // Handle errors
  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}

testMCPServer();