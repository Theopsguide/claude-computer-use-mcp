console.log('=== Validation Logic Tests ===\n');

// Import validation functions directly
const { 
  validateUrl, 
  validateSelector, 
  validateScript, 
  validateSessionId,
  validateText,
  validateTimeout,
  ValidationError,
  SecurityError
} = require('./dist/validation.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}: ${error.message}`);
    failed++;
  }
}

function shouldThrow(name, fn, errorType) {
  try {
    fn();
    console.log(`✗ ${name}: Expected error but none was thrown`);
    failed++;
  } catch (error) {
    if (errorType && !(error instanceof errorType)) {
      console.log(`✗ ${name}: Wrong error type. Expected ${errorType.name}, got ${error.constructor.name}`);
      failed++;
    } else {
      console.log(`✓ ${name}`);
      passed++;
    }
  }
}

console.log('1. URL Validation Tests');
test('Valid HTTPS URL', () => validateUrl('https://example.com'));
test('Valid HTTP URL', () => validateUrl('http://example.com'));
shouldThrow('File protocol blocked', () => validateUrl('file:///etc/passwd'), SecurityError);
shouldThrow('FTP protocol blocked', () => validateUrl('ftp://example.com'), SecurityError);
shouldThrow('Localhost blocked', () => validateUrl('http://localhost'), SecurityError);
shouldThrow('127.0.0.1 blocked', () => validateUrl('http://127.0.0.1'), SecurityError);
shouldThrow('Internal IP 192.168.x.x blocked', () => validateUrl('http://192.168.1.1'), SecurityError);
shouldThrow('Internal IP 10.x.x.x blocked', () => validateUrl('http://10.0.0.1'), SecurityError);
shouldThrow('Invalid URL format', () => validateUrl('not a url'), ValidationError);
shouldThrow('Empty URL', () => validateUrl(''), ValidationError);

console.log('\n2. Selector Validation Tests');
test('Valid simple selector', () => validateSelector('#id'));
test('Valid complex selector', () => validateSelector('div.class > p:nth-child(2)'));
shouldThrow('Script tag blocked', () => validateSelector('<script>alert("xss")</script>'), SecurityError);
shouldThrow('JavaScript protocol blocked', () => validateSelector('javascript:alert(1)'), SecurityError);
shouldThrow('Empty selector', () => validateSelector(''), ValidationError);
shouldThrow('Selector too long', () => validateSelector('a'.repeat(1000)), ValidationError);

console.log('\n3. Script Validation Tests');
shouldThrow('Script execution disabled by default', () => validateScript('return 1+1'), SecurityError);

// Test with execution enabled
const enabledConfig = { allowJavaScriptExecution: true, maxScriptLength: 10000 };
test('Valid script with execution enabled', () => validateScript('return document.title', enabledConfig));
shouldThrow('eval() blocked', () => validateScript('eval("alert(1)")', enabledConfig), SecurityError);
shouldThrow('Function constructor blocked', () => validateScript('new Function("alert(1)")', enabledConfig), SecurityError);
shouldThrow('require() blocked', () => validateScript('require("fs")', enabledConfig), SecurityError);
shouldThrow('import blocked', () => validateScript('import fs from "fs"', enabledConfig), SecurityError);
shouldThrow('fetch() blocked', () => validateScript('fetch("/api/data")', enabledConfig), SecurityError);
shouldThrow('XMLHttpRequest blocked', () => validateScript('new XMLHttpRequest()', enabledConfig), SecurityError);
shouldThrow('process access blocked', () => validateScript('process.env', enabledConfig), SecurityError);
shouldThrow('__proto__ blocked', () => validateScript('obj.__proto__', enabledConfig), SecurityError);
shouldThrow('Script too long', () => validateScript('x'.repeat(20000), enabledConfig), ValidationError);

console.log('\n4. Session ID Validation Tests');
test('Valid session ID', () => validateSessionId('session-a1b2c3d4e5f67890abcdef0123456789'));
shouldThrow('Invalid format', () => validateSessionId('invalid-session'), ValidationError);
shouldThrow('Empty session ID', () => validateSessionId(''), ValidationError);
shouldThrow('Null session ID', () => validateSessionId(null), ValidationError);

console.log('\n5. Text Validation Tests');
test('Valid text', () => validateText('Hello, world!'));
test('Empty text allowed', () => validateText(''));
shouldThrow('Text too long', () => validateText('x'.repeat(100000)), ValidationError);
shouldThrow('Non-string text', () => validateText(123), ValidationError);

console.log('\n6. Timeout Validation Tests');
test('Valid timeout', () => {
  const timeout = validateTimeout(5000);
  if (timeout !== 5000) throw new Error('Timeout not returned correctly');
});
test('Default timeout', () => {
  const timeout = validateTimeout(undefined);
  if (timeout !== 30000) throw new Error('Default timeout not 30000');
});
shouldThrow('Negative timeout', () => validateTimeout(-1000), ValidationError);
shouldThrow('Timeout too large', () => validateTimeout(400000), ValidationError);
shouldThrow('NaN timeout', () => validateTimeout(NaN), ValidationError);

console.log('\n=== Test Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All validation tests passed!');
  process.exit(0);
}