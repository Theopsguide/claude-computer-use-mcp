import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EnterpriseConfig, LogLevel } from './types.js';
import { monitoring } from './monitoring.js';
import { BrowserController } from './browser-controller.js';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  uptime: number;
  version: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
    };
  };
  metadata: {
    activeSessions: number;
    totalRequests: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
  };
}

export interface MetricsData {
  timestamp: number;
  metrics: {
    http_requests_total: number;
    http_request_duration_ms: number;
    browser_sessions_active: number;
    browser_sessions_total: number;
    memory_usage_bytes: number;
    cpu_usage_percent: number;
    errors_total: number;
  };
}

export class EnterpriseManager {
  private config: EnterpriseConfig;
  private browserController: BrowserController;
  private healthServer?: http.Server;
  private metricsServer?: http.Server;
  private startTime: number;
  private requestCount = 0;
  private errorCount = 0;
  private lastCpuUsage = process.cpuUsage();

  constructor(config: EnterpriseConfig, browserController: BrowserController) {
    this.config = config;
    this.browserController = browserController;
    this.startTime = Date.now();

    if (config.enableHealthChecks) {
      this.startHealthServer();
    }

    if (config.enableMetrics) {
      // this.startMetricsServer(); // TODO: Implement metrics server
    }

    // Start periodic health checks
    setInterval(() => this.performHealthCheck(), 30000); // Every 30 seconds
  }

  private async startHealthServer(): Promise<void> {
    this.healthServer = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      try {
        if (url.pathname === '/health') {
          const health = await this.getHealthStatus();
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(health.status === 'healthy' ? 200 : 503);
          res.end(JSON.stringify(health, null, 2));
        } else if (url.pathname === '/health/ready') {
          // Readiness probe
          const ready = await this.isReady();
          res.writeHead(ready ? 200 : 503);
          res.end(ready ? 'Ready' : 'Not Ready');
        } else if (url.pathname === '/health/live') {
          // Liveness probe
          const live = await this.isLive();
          res.writeHead(live ? 200 : 503);
          res.end(live ? 'Live' : 'Not Live');
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      } catch (error) {
        res.writeHead(500);
        res.end(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    this.healthServer.listen(this.config.healthCheckPort, () => {
      console.log(`Health check server listening on port ${this.config.healthCheckPort}`);
    });
  }

  private async getHealthStatus(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    // Check browser controller
    try {
      const sessions = await this.browserController.listSessions();
      checks.browser_controller = {
        status: 'pass',
        message: `${sessions.length} active sessions`
      };
    } catch (error) {
      checks.browser_controller = {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      overallStatus = 'unhealthy';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    if (memUsageMB > 1000) { // Over 1GB
      checks.memory = {
        status: 'warn',
        message: `High memory usage: ${memUsageMB.toFixed(2)}MB`
      };
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    } else {
      checks.memory = {
        status: 'pass',
        message: `Memory usage: ${memUsageMB.toFixed(2)}MB`
      };
    }

    return {
      status: overallStatus,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: '1.2.0',
      checks,
      metadata: {
        activeSessions: (await this.browserController.listSessions()).length,
        totalRequests: this.requestCount,
        memoryUsage: process.memoryUsage(),
        cpuUsage: this.getCpuUsage()
      }
    };
  }

  private async isReady(): Promise<boolean> {
    try {
      await this.browserController.listSessions();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async isLive(): Promise<boolean> {
    return true;
  }

  private getCpuUsage(): number {
    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();
    
    const totalTime = currentUsage.user + currentUsage.system;
    return (totalTime / 1000000) * 100;
  }

  private async performHealthCheck(): Promise<void> {
    const health = await this.getHealthStatus();
    
    monitoring.auditLog({
      level: health.status === 'healthy' ? 'info' : 'warn',
      action: 'health_check',
      details: {
        status: health.status,
        activeSessions: health.metadata.activeSessions,
        memoryUsageMB: (health.metadata.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)
      }
    });
  }

  incrementRequestCount(): void {
    this.requestCount++;
  }

  incrementErrorCount(): void {
    this.errorCount++;
  }

  async cleanup(): Promise<void> {
    if (this.healthServer) {
      this.healthServer.close();
    }
    if (this.metricsServer) {
      this.metricsServer.close();
    }
  }
}