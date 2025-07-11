# Claude Computer Use MCP Server - API Reference

## Overview

This document provides a complete API reference for all tools exposed by the Claude Computer Use MCP Server.

## Tools

### browser_launch

Launch a new browser instance.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| headless | boolean | No | true | Run browser in headless mode |

**Returns:**
```json
{
  "sessionId": "session-1",
  "message": "Browser session session-1 created successfully"
}
```

**Example:**
```
Use browser_launch with headless set to false to see the browser window
```

---

### browser_navigate

Navigate to a URL in the browser.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID |
| url | string | Yes | URL to navigate to |

**Returns:**
```json
{
  "success": true,
  "url": "https://example.com"
}
```

**Example:**
```
Use browser_navigate to go to https://example.com with the session ID from browser_launch
```

---

### browser_screenshot

Take a screenshot of the current page.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sessionId | string | Yes | - | Browser session ID |
| fullPage | boolean | No | false | Capture full scrollable page |

**Returns:**
```json
{
  "screenshot": "base64-encoded-png-data...",
  "mimeType": "image/png"
}
```

**Example:**
```
Take a full page screenshot using browser_screenshot with fullPage set to true
```

---

### browser_click

Click on an element using a CSS selector.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID |
| selector | string | Yes | CSS selector of element to click |

**Returns:**
```json
{
  "success": true,
  "selector": "button.submit"
}
```

**Example:**
```
Click the submit button using browser_click with selector "button[type='submit']"
```

---

### browser_type

Type text into an input field.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID |
| selector | string | Yes | CSS selector of the input field |
| text | string | Yes | Text to type |

**Returns:**
```json
{
  "success": true,
  "selector": "input#username",
  "text": "john.doe"
}
```

**Example:**
```
Type "john.doe" into the username field using browser_type with selector "#username"
```

---

### browser_select

Select an option from a dropdown menu.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID |
| selector | string | Yes | CSS selector of the select element |
| value | string | Yes | Value of the option to select |

**Returns:**
```json
{
  "success": true,
  "selector": "select#country",
  "value": "US"
}
```

**Example:**
```
Select "United States" from the country dropdown using browser_select
```

---

### browser_wait

Wait for an element to appear on the page.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sessionId | string | Yes | - | Browser session ID |
| selector | string | Yes | - | CSS selector to wait for |
| timeout | number | No | 30000 | Timeout in milliseconds |

**Returns:**
```json
{
  "success": true,
  "selector": ".loading-complete"
}
```

**Example:**
```
Wait for the page to finish loading by using browser_wait with selector ".content-loaded"
```

---

### browser_execute

Execute JavaScript code in the browser context.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID |
| script | string | Yes | JavaScript code to execute |

**Returns:**
```json
{
  "result": "return value from JavaScript"
}
```

**Example:**
```
Get the page title using browser_execute with script "return document.title"
```

---

### browser_get_text

Extract text content from an element.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID |
| selector | string | Yes | CSS selector of the element |

**Returns:**
```json
{
  "text": "Element text content"
}
```

**Example:**
```
Get the main heading text using browser_get_text with selector "h1"
```

---

### browser_get_attribute

Get an attribute value from an element.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID |
| selector | string | Yes | CSS selector of the element |
| attribute | string | Yes | Attribute name to retrieve |

**Returns:**
```json
{
  "value": "attribute-value"
}
```

**Example:**
```
Get the href of a link using browser_get_attribute with selector "a.link" and attribute "href"
```

---

### browser_get_url

Get the current page URL.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID |

**Returns:**
```json
{
  "url": "https://example.com/page"
}
```

**Example:**
```
Check the current URL using browser_get_url
```

---

### browser_get_title

Get the current page title.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID |

**Returns:**
```json
{
  "title": "Page Title"
}
```

**Example:**
```
Get the page title using browser_get_title
```

---

### browser_list_sessions

List all active browser sessions.

**Parameters:**
None

**Returns:**
```json
{
  "sessions": [
    {
      "id": "session-1",
      "url": "https://example.com",
      "createdAt": "2025-01-11T12:00:00Z"
    }
  ]
}
```

**Example:**
```
List all active browser sessions using browser_list_sessions
```

---

### browser_close

Close a browser session and free resources.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Browser session ID to close |

**Returns:**
```json
{
  "success": true,
  "message": "Session session-1 closed"
}
```

**Example:**
```
Close the browser using browser_close with the session ID
```

## Error Handling

All tools return errors in a consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common errors:
- `Session {id} not found` - Invalid or expired session ID
- `Element not found` - CSS selector didn't match any elements
- `Timeout` - Operation exceeded the timeout period
- `Navigation failed` - Unable to load the requested URL

## Best Practices

1. **Always close sessions**: Call `browser_close` when done to free resources
2. **Use specific selectors**: Prefer IDs and unique classes over generic selectors
3. **Handle timeouts**: Set appropriate timeouts for `browser_wait` operations
4. **Check element existence**: Use `browser_wait` before interacting with dynamic content
5. **Error handling**: Always handle potential errors in your automation flows

## Examples

### Web Scraping Example
```
1. Launch browser with browser_launch
2. Navigate to target site with browser_navigate
3. Wait for content with browser_wait selector ".content"
4. Extract text with browser_get_text selector ".article-body"
5. Close browser with browser_close
```

### Form Automation Example
```
1. Launch browser with browser_launch
2. Navigate to form with browser_navigate
3. Fill username with browser_type selector "#username" text "user@example.com"
4. Fill password with browser_type selector "#password" text "securepass"
5. Click submit with browser_click selector "button[type='submit']"
6. Wait for result with browser_wait selector ".success-message"
7. Take screenshot with browser_screenshot
8. Close browser with browser_close
```

### JavaScript Execution Example
```
1. Launch browser with browser_launch
2. Navigate to page with browser_navigate
3. Execute script with browser_execute script "return Array.from(document.querySelectorAll('a')).map(a => a.href)"
4. Process the returned links
5. Close browser with browser_close
```