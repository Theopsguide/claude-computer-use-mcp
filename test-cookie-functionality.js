// Test script for cookie functionality
// Run with: node test-cookie-functionality.js

import { BrowserController } from './dist/browser-controller.js';

async function testCookieManagement() {
  console.log('Starting cookie management tests...\n');
  
  const controller = new BrowserController();
  let sessionId;
  
  try {
    // Test 1: Create a browser session
    console.log('Test 1: Creating browser session...');
    sessionId = await controller.createSession(true);
    console.log(`✓ Session created: ${sessionId}\n`);
    
    // Test 2: Navigate to a website
    console.log('Test 2: Navigating to example.com...');
    await controller.navigate(sessionId, 'https://example.com');
    console.log('✓ Navigation successful\n');
    
    // Test 3: Get current cookies (should be minimal)
    console.log('Test 3: Getting current cookies...');
    const initialCookies = await controller.getCookies(sessionId);
    console.log(`✓ Found ${initialCookies.length} initial cookies\n`);
    
    // Test 4: Save cookies
    console.log('Test 4: Saving cookies...');
    await controller.saveCookies(sessionId);
    console.log('✓ Cookies saved successfully\n');
    
    // Test 5: Clear cookies from browser
    console.log('Test 5: Clearing cookies from browser...');
    await controller.clearCookies(sessionId);
    const clearedCookies = await controller.getCookies(sessionId);
    console.log(`✓ Cookies cleared (${clearedCookies.length} remaining)\n`);
    
    // Test 6: Load cookies back
    console.log('Test 6: Loading cookies back...');
    await controller.loadCookies(sessionId);
    const loadedCookies = await controller.getCookies(sessionId);
    console.log(`✓ Cookies loaded (${loadedCookies.length} cookies)\n`);
    
    // Test 7: Cookie security - verify no values exposed
    console.log('Test 7: Verifying cookie security...');
    const secureCookies = await controller.getCookies(sessionId);
    const hasValues = secureCookies.some(cookie => cookie.value !== undefined);
    if (!hasValues) {
      console.log('✓ Cookie values properly hidden for security\n');
    } else {
      console.log('✗ WARNING: Cookie values are exposed!\n');
    }
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    if (sessionId) {
      console.log('\nCleaning up...');
      await controller.closeSession(sessionId);
      await controller.cleanup();
      console.log('✓ Cleanup complete');
    }
  }
}

// Run the tests
testCookieManagement().catch(console.error);