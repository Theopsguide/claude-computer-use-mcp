# Claude Computer Use MCP Server - Usage Guide

## Overview

This MCP server provides browser automation capabilities to Claude Code, allowing it to:
- Launch and control web browsers
- Navigate to websites
- Interact with page elements
- Extract information from web pages
- Take screenshots
- Execute custom JavaScript

## Available Tools

### browser_launch
Launch a new browser instance.

**Parameters:**
- `headless` (boolean, optional): Run browser in headless mode (default: true)

**Returns:**
- `sessionId`: Unique identifier for the browser session
- `message`: Success message

### browser_navigate
Navigate to a URL in the browser.

**Parameters:**
- `sessionId` (string, required): Browser session ID
- `url` (string, required): URL to navigate to

### browser_screenshot
Take a screenshot of the current page.

**Parameters:**
- `sessionId` (string, required): Browser session ID
- `fullPage` (boolean, optional): Capture full page (default: false)

**Returns:**
- `screenshot`: Base64-encoded PNG image
- `mimeType`: "image/png"

### browser_click
Click on an element.

**Parameters:**
- `sessionId` (string, required): Browser session ID
- `selector` (string, required): CSS selector or text to click

### browser_type
Type text into an input field.

**Parameters:**
- `sessionId` (string, required): Browser session ID
- `selector` (string, required): CSS selector of the input
- `text` (string, required): Text to type

### browser_select
Select an option from a dropdown.

**Parameters:**
- `sessionId` (string, required): Browser session ID
- `selector` (string, required): CSS selector of the select element
- `value` (string, required): Value to select

### browser_wait
Wait for an element to appear.

**Parameters:**
- `sessionId` (string, required): Browser session ID
- `selector` (string, required): CSS selector to wait for
- `timeout` (number, optional): Timeout in milliseconds (default: 30000)

### browser_execute
Execute JavaScript in the browser context.

**Parameters:**
- `sessionId` (string, required): Browser session ID
- `script` (string, required): JavaScript code to execute

**Returns:**
- `result`: The result of the JavaScript execution

### browser_get_text
Get text content from an element.

**Parameters:**
- `sessionId` (string, required): Browser session ID
- `selector` (string, required): CSS selector of the element

**Returns:**
- `text`: The text content of the element

### browser_get_attribute
Get an attribute value from an element.

**Parameters:**
- `sessionId` (string, required): Browser session ID
- `selector` (string, required): CSS selector of the element
- `attribute` (string, required): Attribute name to get

**Returns:**
- `value`: The attribute value

### browser_get_url
Get the current page URL.

**Parameters:**
- `sessionId` (string, required): Browser session ID

**Returns:**
- `url`: Current page URL

### browser_get_title
Get the current page title.

**Parameters:**
- `sessionId` (string, required): Browser session ID

**Returns:**
- `title`: Current page title

### browser_list_sessions
List all active browser sessions.

**Returns:**
- `sessions`: Array of session objects with id, url, and createdAt

### browser_close
Close a browser session.

**Parameters:**
- `sessionId` (string, required): Browser session ID to close

## Example Workflows

### Basic Web Scraping
```
1. Use browser_launch to start a browser
2. Use browser_navigate to go to the target website
3. Use browser_wait to ensure the page is loaded
4. Use browser_get_text to extract information
5. Use browser_close to clean up
```

### Form Automation
```
1. Use browser_launch to start a browser
2. Use browser_navigate to go to the form
3. Use browser_type to fill in text fields
4. Use browser_select for dropdown selections
5. Use browser_click to submit the form
6. Use browser_wait for confirmation
7. Use browser_screenshot to capture results
```

### JavaScript Interaction
```
1. Use browser_launch to start a browser
2. Use browser_navigate to go to the page
3. Use browser_execute to run custom JavaScript
4. Use browser_get_text or browser_execute to retrieve results
```

## Best Practices

1. **Always close sessions**: Use browser_close when done to free resources
2. **Use selectors wisely**: Prefer stable CSS selectors or data attributes
3. **Handle timeouts**: Set appropriate timeouts for browser_wait
4. **Error handling**: The MCP server will return error messages for invalid operations
5. **Headless mode**: Use headless mode for automation, disable for debugging

## Troubleshooting

- **Session not found**: Ensure you're using a valid sessionId from browser_launch
- **Element not found**: Verify your CSS selector is correct
- **Timeout errors**: Increase the timeout or check if the page is loading correctly
- **Dependencies**: Ensure Playwright dependencies are installed with `sudo npx playwright install-deps`