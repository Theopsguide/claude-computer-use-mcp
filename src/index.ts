#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BrowserController } from './browser-controller.js';
import { createTools } from './tools.js';
import { BrowserTools } from './types.js';

const browserController = new BrowserController();
const tools: BrowserTools = createTools(browserController);

const server = new Server(
  {
    name: 'claude-computer-use',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  const tool = tools[name as keyof BrowserTools];
  if (!tool) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: Unknown tool: ${name}`,
        },
      ],
      isError: true,
    };
  }
  
  try {
    // Type assertion is safe here because we validate tools exist
    const result = await (tool.handler as any)(args || {});
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Cleanup on shutdown
process.on('SIGINT', async () => {
  try {
    await browserController.closeAllSessions();
  } catch (error) {
    console.error('Error closing sessions on SIGINT:', error);
  } finally {
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  try {
    await browserController.closeAllSessions();
  } catch (error) {
    console.error('Error closing sessions on SIGTERM:', error);
  } finally {
    process.exit(0);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  try {
    await browserController.closeAllSessions();
  } catch (closeError) {
    console.error('Error closing sessions after uncaught exception:', closeError);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  try {
    await browserController.closeAllSessions();
  } catch (error) {
    console.error('Error closing sessions after unhandled rejection:', error);
  }
  process.exit(1);
});

// Start the server
async function main(): Promise<void> {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Claude Computer Use MCP Server started');
  } catch (error) {
    console.error('Failed to connect transport:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});