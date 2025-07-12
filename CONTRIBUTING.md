# Contributing to Claude Computer Use MCP Server

Thank you for your interest in contributing to the Claude Computer Use MCP Server! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in [GitHub Issues](https://github.com/Theopsguide/claude-computer-use-mcp/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (if applicable)
   - Expected vs actual behavior
   - System information (OS, Node version, etc.)

### Suggesting Features

1. Open a [GitHub Issue](https://github.com/Theopsguide/claude-computer-use-mcp/issues) with "Feature Request" label
2. Describe the feature and its use case
3. Explain why it would benefit users

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Commit with descriptive messages
7. Push to your fork
8. Open a Pull Request with:
   - Clear description of changes
   - Reference to any related issues
   - Screenshots/examples if relevant

## Development Setup

1. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/claude-computer-use-mcp.git
cd claude-computer-use-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run in development mode:
```bash
npm run dev
```

## Project Structure

```
claude-computer-use-mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── browser-controller.ts  # Browser management logic
│   └── tools.ts          # Tool definitions
├── dist/                 # Compiled JavaScript (git-ignored)
├── test-*.js            # Test files
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
└── README.md            # Project documentation
```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript strict mode
- Define interfaces for complex types
- Add JSDoc comments for public methods
- Use meaningful variable names
- Keep functions focused and small

### Code Style

- 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Max line length: 100 characters
- Use async/await over promises

Example:
```typescript
/**
 * Navigate to a URL in the browser
 * @param sessionId - The browser session ID
 * @param url - The URL to navigate to
 */
async navigate(sessionId: string, url: string): Promise<void> {
  const session = this.getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  await session.page.goto(url, { waitUntil: 'networkidle' });
}
```

### Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Example: `feat: add browser_scroll tool for page scrolling`

## Testing

### Running Tests

```bash
# Test MCP protocol
node test-mcp-protocol.js

# Test browser functionality (requires dependencies)
node test-browser-functionality.js
```

### Writing Tests

- Test both success and error cases
- Mock browser dependencies when possible
- Use descriptive test names
- Clean up resources after tests

## Adding New Tools

To add a new browser automation tool:

1. Add the tool definition in `src/tools.ts`:
```typescript
browser_new_tool: {
  description: 'Clear description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Browser session ID' },
      // Add other parameters
    },
    required: ['sessionId']
  },
  handler: async (args: any) => {
    const { sessionId, /* other params */ } = args;
    // Implement tool logic
    return { success: true };
  }
}
```

2. Add corresponding method in `src/browser-controller.ts` if needed

3. Update documentation:
   - Add to API.md
   - Add example to EXAMPLES.md
   - Update README.md if significant

4. Add tests for the new tool

## Documentation

- Keep README.md updated with new features
- Document all tool parameters in API.md
- Provide practical examples in EXAMPLES.md
- Use clear, concise language
- Include code examples where helpful

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release PR
4. After merge, tag release: `git tag v1.x.x`
5. Push tag: `git push origin v1.x.x`

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion in GitHub Discussions
- Reach out to maintainers

Thank you for contributing to make Claude Computer Use MCP Server better!