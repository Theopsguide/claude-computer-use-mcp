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
import { monitoring } from './monitoring.js';
import { ClaudeIntegration } from './claude-integration.js';
import { EnterpriseManager } from './enterprise.js';
import { SECURITY_CONFIG, ENTERPRISE_CONFIG } from './config.js';
import * as fs from 'fs/promises';

// Version will be set from package.json
let version = '1.2.0';

// Initialize version from package.json
try {
  const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
  version = packageJson.version;
} catch {
  // Use default version if package.json not found
}

// Initialize core components
const browserController = new BrowserController(SECURITY_CONFIG);
const tools = createTools(browserController);
const claudeIntegration = new ClaudeIntegration(browserController);
const enterpriseManager = new EnterpriseManager(ENTERPRISE_CONFIG, browserController);

// Initialize monitoring
monitoring.enableMetrics = SECURITY_CONFIG.enableMetrics;
monitoring.enableAuditLogging = SECURITY_CONFIG.enableAuditLogging;

const server = new Server(
  {
    name: 'claude-computer-use',
    version,
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

// Handle tool calls with enhanced error handling and monitoring
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();
  
  // Track request for enterprise metrics
  enterpriseManager.incrementRequestCount();
  
  const tool = tools[name as keyof typeof tools];
  if (!tool) {
    enterpriseManager.incrementErrorCount();
    monitoring.auditLog({
      level: 'error',
      action: 'unknown_tool',
      details: { toolName: name, availableTools: Object.keys(tools) }
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: Unknown tool: ${name}. Available tools: ${Object.keys(tools).join(', ')}`,
        },
      ],
      isError: true,
    };
  }
  
  try {
    // Enhanced error handling for specific Claude Code integration
    const result = await (tool.handler as (args: any) => Promise<any>)(args || {});
    
    const duration = Date.now() - startTime;
    
    // Record successful operation
    monitoring.recordMetric({
      sessionId: args?.sessionId || 'unknown',
      action: name,
      duration,
      success: true
    });
    
    // Record workflow step if session provided
    if (args?.sessionId) {
      await claudeIntegration.recordWorkflowStep(args.sessionId, name, {
        selector: args.selector,
        value: args.value || args.text || args.url
      });
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    enterpriseManager.incrementErrorCount();
    
    // Record failed operation
    monitoring.recordMetric({
      sessionId: args?.sessionId || 'unknown',
      action: name,
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Get enhanced error handling suggestions
    let errorResponse = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    if (args?.sessionId) {
      try {
        const errorAnalysis = await claudeIntegration.handleError(
          args.sessionId, 
          error instanceof Error ? error : new Error('Unknown error'),
          { tool: name, args }
        );
        
        errorResponse = `Error: ${errorAnalysis.error}\n\nSuggestions:\n${errorAnalysis.suggestions.map(s => `• ${s}`).join('\n')}`;
        
        if (errorAnalysis.recoveryActions.length > 0) {
          errorResponse += `\n\nRecovery Actions:\n${errorAnalysis.recoveryActions.map(a => `• ${a.action}: ${a.description}`).join('\n')}`;
        }
      } catch (analysisError) {
        // If error analysis fails, use simple error message
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: errorResponse,
        },
      ],
      isError: true,
    };
  }
});

// Enhanced cleanup with enterprise features
process.on('SIGINT', async () => {
  console.error('Received SIGINT, gracefully shutting down...');
  try {
    await browserController.closeAllSessions();
    await enterpriseManager.cleanup();
    await monitoring.cleanup();
    
    monitoring.auditLog({
      level: 'info',
      action: 'server_shutdown',
      details: { signal: 'SIGINT', graceful: true }
    });
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  } finally {
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, gracefully shutting down...');
  try {
    await browserController.closeAllSessions();
    await enterpriseManager.cleanup();
    await monitoring.cleanup();
    
    monitoring.auditLog({
      level: 'info',
      action: 'server_shutdown',
      details: { signal: 'SIGTERM', graceful: true }
    });
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  } finally {
    process.exit(0);
  }
});

// Handle uncaught exceptions with better logging
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  
  monitoring.auditLog({
    level: 'error',
    action: 'uncaught_exception',
    details: { 
      error: error.message, 
      stack: error.stack,
      timestamp: Date.now()
    }
  });
  
  try {
    await browserController.closeAllSessions();
    await enterpriseManager.cleanup();
    await monitoring.cleanup();
  } catch (closeError) {
    console.error('Error during emergency cleanup:', closeError);
  }
  process.exit(1);
});

// Handle unhandled promise rejections with better logging
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  
  monitoring.auditLog({
    level: 'error',
    action: 'unhandled_rejection',
    details: { 
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: Date.now()
    }
  });
  
  try {
    await browserController.closeAllSessions();
    await enterpriseManager.cleanup();
    await monitoring.cleanup();
  } catch (error) {
    console.error('Error during emergency cleanup:', error);
  }
  process.exit(1);
});

// Start the server with enhanced initialization
async function main(): Promise<void> {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log startup with all enabled features
    const features = {
      security: {
        contentSecurityPolicy: SECURITY_CONFIG.enableContentSecurityPolicy,
        requestInterception: SECURITY_CONFIG.enableRequestInterception,
        auditLogging: SECURITY_CONFIG.enableAuditLogging,
        sandboxMode: SECURITY_CONFIG.sandboxMode
      },
      enterprise: {
        healthChecks: ENTERPRISE_CONFIG.enableHealthChecks,
        metrics: ENTERPRISE_CONFIG.enableMetrics,
        tracing: ENTERPRISE_CONFIG.enableTracing
      },
      claude: {
        smartWaiting: true,
        workflowRecording: true,
        semanticSelectors: true
      }
    };
    
    monitoring.auditLog({
      level: 'info',
      action: 'server_started',
      details: {
        version,
        features,
        toolsAvailable: Object.keys(tools).length,
        pid: process.pid,
        nodeVersion: process.version
      }
    });
    
    console.error(`🚀 Claude Computer Use MCP Server v${version} started successfully!`);
    console.error(`📊 Features: ${Object.keys(tools).length} tools, Health checks: ${ENTERPRISE_CONFIG.enableHealthChecks ? 'enabled' : 'disabled'}, Metrics: ${ENTERPRISE_CONFIG.enableMetrics ? 'enabled' : 'disabled'}`);
    
    if (ENTERPRISE_CONFIG.enableHealthChecks) {
      console.error(`🏥 Health checks available at: http://localhost:${ENTERPRISE_CONFIG.healthCheckPort}/health`);
    }
    
    if (ENTERPRISE_CONFIG.enableMetrics) {
      console.error(`📈 Metrics available at: http://localhost:${ENTERPRISE_CONFIG.metricsPort}/metrics`);
    }
    
  } catch (error) {
    console.error('Failed to connect transport:', error);
    
    monitoring.auditLog({
      level: 'error',
      action: 'server_start_failed',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    
    throw error;
  }
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});