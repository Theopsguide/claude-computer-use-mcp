import { MetricsData, AuditLogEntry, LogLevel } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

export class MonitoringService extends EventEmitter {
  private metricsBuffer: MetricsData[] = [];
  private auditLogBuffer: AuditLogEntry[] = [];
  private logDir: string;
  public enableMetrics: boolean;
  public enableAuditLogging: boolean;
  private flushInterval: NodeJS.Timeout;

  constructor(options: {
    logDir?: string;
    enableMetrics?: boolean;
    enableAuditLogging?: boolean;
    flushIntervalMs?: number;
  } = {}) {
    super();
    this.logDir = options.logDir || './logs';
    this.enableMetrics = options.enableMetrics || false;
    this.enableAuditLogging = options.enableAuditLogging || false;
    
    // Flush buffers periodically
    this.flushInterval = setInterval(() => this.flush(), options.flushIntervalMs || 30000);
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      await fs.chmod(this.logDir, 0o700);
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
    }
  }

  recordMetric(metric: Omit<MetricsData, 'timestamp'>): void {
    if (!this.enableMetrics) return;

    const metricWithTimestamp: MetricsData = {
      ...metric,
      timestamp: Date.now()
    };

    this.metricsBuffer.push(metricWithTimestamp);
    this.emit('metric', metricWithTimestamp);

    // Auto-flush if buffer gets too large
    if (this.metricsBuffer.length >= 100) {
      this.flush();
    }
  }

  auditLog(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    if (!this.enableAuditLogging) return;

    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: Date.now()
    };

    this.auditLogBuffer.push(logEntry);
    this.emit('audit', logEntry);

    // Console output for important events
    if (['error', 'warn'].includes(entry.level)) {
      console.log(`[${entry.level.toUpperCase()}] ${entry.action}:`, entry.details);
    }

    // Auto-flush if buffer gets too large
    if (this.auditLogBuffer.length >= 50) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    try {
      if (this.metricsBuffer.length > 0) {
        await this.flushMetrics();
      }
      if (this.auditLogBuffer.length > 0) {
        await this.flushAuditLogs();
      }
    } catch (error) {
      console.error('Failed to flush monitoring data:', error);
    }
  }

  private async flushMetrics(): Promise<void> {
    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    const date = new Date().toISOString().split('T')[0];
    const filename = `metrics-${date}.jsonl`;
    const filepath = path.join(this.logDir, filename);

    const lines = metrics.map(metric => JSON.stringify(metric)).join('\n') + '\n';
    await fs.appendFile(filepath, lines, 'utf8');
  }

  private async flushAuditLogs(): Promise<void> {
    const logs = [...this.auditLogBuffer];
    this.auditLogBuffer = [];

    const date = new Date().toISOString().split('T')[0];
    const filename = `audit-${date}.jsonl`;
    const filepath = path.join(this.logDir, filename);

    const lines = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
    await fs.appendFile(filepath, lines, 'utf8');
  }

  async getMetrics(fromDate?: Date, toDate?: Date): Promise<MetricsData[]> {
    const metrics: MetricsData[] = [];
    
    try {
      const files = await fs.readdir(this.logDir);
      const metricsFiles = files.filter(f => f.startsWith('metrics-') && f.endsWith('.jsonl'));

      for (const file of metricsFiles) {
        const content = await fs.readFile(path.join(this.logDir, file), 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const metric: MetricsData = JSON.parse(line);
            
            if (fromDate && metric.timestamp < fromDate.getTime()) continue;
            if (toDate && metric.timestamp > toDate.getTime()) continue;
            
            metrics.push(metric);
          } catch (error) {
            console.warn('Failed to parse metric line:', line);
          }
        }
      }
    } catch (error) {
      console.error('Failed to read metrics:', error);
    }

    return metrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  async getAuditLogs(fromDate?: Date, toDate?: Date, level?: LogLevel): Promise<AuditLogEntry[]> {
    const logs: AuditLogEntry[] = [];
    
    try {
      const files = await fs.readdir(this.logDir);
      const auditFiles = files.filter(f => f.startsWith('audit-') && f.endsWith('.jsonl'));

      for (const file of auditFiles) {
        const content = await fs.readFile(path.join(this.logDir, file), 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const log: AuditLogEntry = JSON.parse(line);
            
            if (fromDate && log.timestamp < fromDate.getTime()) continue;
            if (toDate && log.timestamp > toDate.getTime()) continue;
            if (level && log.level !== level) continue;
            
            logs.push(log);
          } catch (error) {
            console.warn('Failed to parse audit log line:', line);
          }
        }
      }
    } catch (error) {
      console.error('Failed to read audit logs:', error);
    }

    return logs.sort((a, b) => a.timestamp - b.timestamp);
  }

  generateReport(sessionId?: string): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    errorTypes: { [type: string]: number };
    topActions: { action: string; count: number }[];
  }> {
    return this.getMetrics().then(metrics => {
      const filteredMetrics = sessionId 
        ? metrics.filter(m => m.sessionId === sessionId)
        : metrics;

      const totalRequests = filteredMetrics.length;
      const successfulRequests = filteredMetrics.filter(m => m.success).length;
      const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
      
      const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
      const averageResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0;
      
      const errorTypes: { [type: string]: number } = {};
      const actionCounts: { [action: string]: number } = {};
      
      filteredMetrics.forEach(metric => {
        if (metric.error) {
          errorTypes[metric.error] = (errorTypes[metric.error] || 0) + 1;
        }
        actionCounts[metric.action] = (actionCounts[metric.action] || 0) + 1;
      });
      
      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalRequests,
        successRate,
        averageResponseTime,
        errorTypes,
        topActions
      };
    });
  }

  async cleanup(): Promise<void> {
    clearInterval(this.flushInterval);
    await this.flush();
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Performance monitoring decorator
export function monitored(action: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let success = true;
      let error: string | undefined;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        
        monitoring.recordMetric({
          sessionId: args[0] || 'unknown',
          action: `${target.constructor.name}.${propertyName}`,
          duration,
          success,
          error,
          metadata: { action }
        });
      }
    };

    return descriptor;
  };
}