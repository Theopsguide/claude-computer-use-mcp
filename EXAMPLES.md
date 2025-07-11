# Claude Computer Use MCP Server - Examples

This document provides practical examples of using the Claude Computer Use MCP Server with Claude Code.

## Table of Contents

1. [Basic Browser Control](#basic-browser-control)
2. [Web Scraping](#web-scraping)
3. [Form Automation](#form-automation)
4. [Screenshot Capture](#screenshot-capture)
5. [JavaScript Execution](#javascript-execution)
6. [Multi-Tab Management](#multi-tab-management)
7. [Error Handling](#error-handling)
8. [Advanced Patterns](#advanced-patterns)

## Basic Browser Control

### Launch a browser and navigate to a website

**Claude Code prompt:**
```
Launch a browser and navigate to https://example.com, then tell me the page title
```

**What happens:**
1. Claude uses `browser_launch` to start a new browser session
2. Uses `browser_navigate` to go to the URL
3. Uses `browser_get_title` to retrieve the title
4. Reports back the page title

### Take a screenshot of a website

**Claude Code prompt:**
```
Open https://github.com in a browser and take a full page screenshot
```

**What happens:**
1. Launches browser with `browser_launch`
2. Navigates to GitHub with `browser_navigate`
3. Takes screenshot with `browser_screenshot` (fullPage: true)
4. Returns the screenshot as base64 PNG data

## Web Scraping

### Extract article content

**Claude Code prompt:**
```
Go to https://en.wikipedia.org/wiki/Artificial_intelligence and extract the first paragraph of content
```

**What happens:**
1. Launches browser
2. Navigates to Wikipedia
3. Waits for content to load with `browser_wait`
4. Extracts text with `browser_get_text` using appropriate selector
5. Returns the paragraph text

### Collect all links from a page

**Claude Code prompt:**
```
Visit https://news.ycombinator.com and get me all the article links from the front page
```

**What happens:**
1. Launches browser
2. Navigates to Hacker News
3. Uses `browser_execute` with JavaScript to collect all links:
   ```javascript
   return Array.from(document.querySelectorAll('.titleline > a')).map(a => ({
     text: a.textContent,
     url: a.href
   }))
   ```
4. Returns the list of links

## Form Automation

### Fill and submit a contact form

**Claude Code prompt:**
```
Go to https://example-form.com/contact and fill out the form with:
- Name: John Doe
- Email: john@example.com
- Message: Hello, this is a test message
Then submit the form.
```

**What happens:**
1. Launches browser and navigates to form
2. Uses `browser_type` to fill each field:
   - `browser_type` with selector `#name` and text "John Doe"
   - `browser_type` with selector `#email` and text "john@example.com"
   - `browser_type` with selector `#message` and text "Hello, this is a test message"
3. Clicks submit with `browser_click` on the submit button
4. Waits for confirmation with `browser_wait`

### Login automation

**Claude Code prompt:**
```
Log into the demo site at https://demo.example.com with username "demo" and password "demo123"
```

**What happens:**
1. Navigates to login page
2. Types username with `browser_type`
3. Types password with `browser_type`
4. Clicks login button with `browser_click`
5. Waits for dashboard to load
6. Confirms successful login by checking URL or page content

## Screenshot Capture

### Visual comparison

**Claude Code prompt:**
```
Take screenshots of https://example.com on both mobile and desktop viewport sizes
```

**What happens:**
1. Launches first browser session with mobile viewport
2. Takes screenshot
3. Launches second session with desktop viewport
4. Takes screenshot
5. Returns both screenshots for comparison

### Documentation screenshots

**Claude Code prompt:**
```
Navigate to our docs at https://docs.example.com, click on the "API Reference" section, and take a screenshot of the authentication part
```

**What happens:**
1. Navigates to documentation
2. Clicks on "API Reference" with `browser_click`
3. Waits for content to load
4. Scrolls to authentication section using `browser_execute`
5. Takes focused screenshot

## JavaScript Execution

### Extract structured data

**Claude Code prompt:**
```
Go to https://example-shop.com/products and extract all product names and prices
```

**What happens:**
1. Navigates to products page
2. Executes JavaScript to extract data:
   ```javascript
   return Array.from(document.querySelectorAll('.product')).map(p => ({
     name: p.querySelector('.product-name').textContent,
     price: p.querySelector('.product-price').textContent
   }))
   ```
3. Returns structured product data

### Interact with dynamic content

**Claude Code prompt:**
```
Go to https://example.com/dashboard and expand all collapsed sections
```

**What happens:**
1. Navigates to dashboard
2. Executes JavaScript to find and click all expand buttons:
   ```javascript
   document.querySelectorAll('.expand-button').forEach(btn => btn.click())
   ```
3. Waits for animations to complete
4. Takes screenshot or extracts expanded content

## Multi-Tab Management

### Compare prices across sites

**Claude Code prompt:**
```
Check the price of "iPhone 15" on Amazon, Best Buy, and Apple.com
```

**What happens:**
1. Launches three separate browser sessions
2. Navigates each to respective sites
3. Searches for "iPhone 15" on each
4. Extracts prices using site-specific selectors
5. Compares and reports findings
6. Closes all sessions

### Monitor multiple pages

**Claude Code prompt:**
```
Open three news sites and tell me the top headline from each
```

**What happens:**
1. Launches multiple sessions with `browser_launch`
2. Navigates each to different news sites
3. Extracts headlines with `browser_get_text`
4. Lists all sessions with `browser_list_sessions`
5. Closes all with `browser_close`

## Error Handling

### Graceful failure handling

**Claude Code prompt:**
```
Try to login to https://example.com/admin with username "admin" - if it fails, take a screenshot of the error
```

**What happens:**
1. Attempts login process
2. If error occurs (element not found, timeout, etc.):
   - Takes screenshot of current state
   - Reports specific error message
   - Suggests possible issues

### Retry logic

**Claude Code prompt:**
```
Go to https://flaky-site.com and get the main content - retry up to 3 times if it fails
```

**What happens:**
1. Attempts to navigate and find content
2. If timeout or error occurs, retries with:
   - Longer timeout periods
   - Different wait strategies
   - Alternative selectors

## Advanced Patterns

### Download file automation

**Claude Code prompt:**
```
Go to https://example.com/downloads, click on "Download Report", and wait for the download to complete
```

**What happens:**
1. Navigates to downloads page
2. Clicks download button
3. Waits for download to start
4. Monitors download progress
5. Confirms completion

### Multi-step workflow

**Claude Code prompt:**
```
Complete the checkout process on https://shop.example.com:
1. Add item "Blue T-Shirt" to cart
2. Go to checkout
3. Fill shipping info (use test data)
4. Take screenshot of order summary
5. Don't actually submit the order
```

**What happens:**
1. Navigates to shop
2. Searches for item
3. Clicks "Add to Cart"
4. Navigates to checkout
5. Fills multiple form fields
6. Takes screenshot before final submission
7. Closes browser without completing order

### Performance monitoring

**Claude Code prompt:**
```
Measure how long it takes for https://example.com to fully load
```

**What happens:**
1. Launches browser
2. Records start time
3. Navigates to URL
4. Waits for various load events
5. Executes JavaScript to check performance metrics:
   ```javascript
   return performance.timing.loadEventEnd - performance.timing.navigationStart
   ```
6. Reports load time and performance data

## Tips for Claude Code Users

1. **Be specific with selectors**: Instead of "click the button", say "click the submit button" or provide specific text
2. **Describe expected outcomes**: Tell Claude what should happen after actions
3. **Provide context**: Mention if it's a single-page app, requires login, etc.
4. **Request confirmations**: Ask Claude to verify actions completed successfully
5. **Handle sensitive data carefully**: Don't include real passwords or personal information

## Common Patterns

### Wait for dynamic content
```
Navigate to the page, wait for the loading spinner to disappear, then extract the data
```

### Handle popups
```
If a cookie consent popup appears, click "Accept All" before proceeding
```

### Extract tabular data
```
Find the data table on the page and convert it to a structured format
```

### Test responsive design
```
Check how the navigation menu looks on mobile vs desktop viewports
```

These examples demonstrate the flexibility and power of the Claude Computer Use MCP Server. Combine these patterns to create complex browser automation workflows with natural language instructions to Claude Code.