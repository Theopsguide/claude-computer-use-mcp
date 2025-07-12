const { spawn } = require('child_process');

console.log('=== Security Features Test ===\n');

const server = spawn('node', ['dist/index.js']);

server.stderr.on('data', (data) => {
  const message = data.toString();
  if (message.includes('started')) {
    console.log('✓ Server started');
    runTests();
  }
});

async function sendRequest(id, method, params) {
  const request = JSON.stringify({
    jsonrpc: '2.0',
    id,
    method,
    params
  }) + '\n';
  
  server.stdin.write(request);
  
  return new Promise((resolve) => {
    const handler = (data) => {
      const response = JSON.parse(data.toString());
      if (response.id === id) {
        server.stdout.removeListener('data', handler);
        resolve(response);
      }
    };
    server.stdout.on('data', handler);
  });
}

async function runTests() {
  console.log('\n1. Testing JavaScript execution (should fail by default)...');
  const launchRes = await sendRequest(1, 'tools/call', {
    name: 'browser_launch',
    arguments: { headless: true }
  });
  
  const sessionData = JSON.parse(launchRes.result.content[0].text);
  const sessionId = sessionData.sessionId;
  console.log(`✓ Created session: ${sessionId}`);
  
  const executeRes = await sendRequest(2, 'tools/call', {
    name: 'browser_execute',
    arguments: {
      sessionId,
      script: 'return document.title'
    }
  });
  
  if (executeRes.result.content[0].text.includes('JavaScript execution is disabled')) {
    console.log('✓ JavaScript execution properly blocked');
  } else {
    console.log('✗ JavaScript execution was not blocked!');
  }
  
  console.log('\n2. Testing URL validation...');
  
  // Test file:// protocol
  const fileUrlRes = await sendRequest(3, 'tools/call', {
    name: 'browser_navigate',
    arguments: {
      sessionId,
      url: 'file:///etc/passwd'
    }
  });
  
  if (fileUrlRes.result.content[0].text.includes('not allowed')) {
    console.log('✓ file:// protocol properly blocked');
  } else {
    console.log('✗ file:// protocol was not blocked!');
  }
  
  // Test internal IP
  const internalIpRes = await sendRequest(4, 'tools/call', {
    name: 'browser_navigate',
    arguments: {
      sessionId,
      url: 'http://192.168.1.1'
    }
  });
  
  if (internalIpRes.result.content[0].text.includes('internal IP')) {
    console.log('✓ Internal IP navigation properly blocked');
  } else {
    console.log('✗ Internal IP navigation was not blocked!');
  }
  
  console.log('\n3. Testing input validation...');
  
  // Test overly long selector
  const longSelector = 'a'.repeat(1000);
  const longSelectorRes = await sendRequest(5, 'tools/call', {
    name: 'browser_click',
    arguments: {
      sessionId,
      selector: longSelector
    }
  });
  
  if (longSelectorRes.result.content[0].text.includes('too long')) {
    console.log('✓ Long selector properly rejected');
  } else {
    console.log('✗ Long selector was not rejected!');
  }
  
  // Test malicious selector
  const maliciousSelector = '<script>alert("XSS")</script>';
  const maliciousSelectorRes = await sendRequest(6, 'tools/call', {
    name: 'browser_click',
    arguments: {
      sessionId,
      selector: maliciousSelector
    }
  });
  
  if (maliciousSelectorRes.result.content[0].text.includes('malicious')) {
    console.log('✓ Malicious selector properly rejected');
  } else {
    console.log('✗ Malicious selector was not rejected!');
  }
  
  console.log('\n4. Testing session security...');
  
  // Test invalid session ID format
  const invalidSessionRes = await sendRequest(7, 'tools/call', {
    name: 'browser_get_url',
    arguments: {
      sessionId: 'invalid-id'
    }
  });
  
  if (invalidSessionRes.result.content[0].text.includes('Invalid session ID')) {
    console.log('✓ Invalid session ID format properly rejected');
  } else {
    console.log('✗ Invalid session ID format was not rejected!');
  }
  
  // Clean up
  await sendRequest(8, 'tools/call', {
    name: 'browser_close',
    arguments: { sessionId }
  });
  
  console.log('\n=== All security tests completed ===');
  
  server.kill();
  process.exit(0);
}

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});