import { getSentry } from './sentry-config';
import { getLogger } from './logger';
import { checkDatabaseHealth } from '../database/connection-enhanced';
import { getCacheManager } from '../cache/cache-strategies';
import { getRedisClient } from '../cache/redis-client';

export interface HealthCheck {
  name: string;
  description: string;
  check: () => Promise<HealthCheckResult>;
  timeout?: number;
  critical?: boolean;
  interval?: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: Record<string, any>;
  responseTime?: number;
  timestamp: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, HealthCheckResult>;
  timestamp: Date;
  uptime: number;
  version?: string;
  environment?: string;
}

interface HealthMonitorConfig {
  interval: number;
  timeout: number;
  retries: number;
  enableNotifications: boolean;
  enableMetrics: boolean;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    uptimePercentage: number;
  };
}

export class HealthMonitor {
  private checks: Map<string, HealthCheck> = new Map();
  private results: Map<string, HealthCheckResult[]> = new Map();
  private config: HealthMonitorConfig;
  private monitoringInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  private logger = getLogger();

  constructor(config?: Partial<HealthMonitorConfig>) {
    this.config = {
      interval: 30000, // 30 seconds
      timeout: 10000, // 10 seconds
      retries: 3,
      enableNotifications: true,
      enableMetrics: true,
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.1, // 10%
        uptimePercentage: 99.0, // 99%
      },
      ...config,
    };

    this.registerDefaultHealthChecks();
  }

  private registerDefaultHealthChecks(): void {
    // Database health check
    this.register({
      name: 'database',
      description: 'Database connectivity and integrity',
      critical: true,
      check: async () => {
        try {
          const dbHealth = await checkDatabaseHealth();
          
          return {
            healthy: dbHealth.healthy,
            status: dbHealth.healthy ? 'healthy' : 'unhealthy',
            message: dbHealth.healthy ? 'Database is healthy' : 'Database issues detected',
            details: dbHealth.details,
            timestamp: new Date(),
          };
        } catch (error) {
          return {
            healthy: false,
            status: 'unhealthy' as const,
            message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
          };
        }
      },
    });

    // Cache health check
    this.register({
      name: 'cache',
      description: 'Cache system (Redis + Memory) health',
      critical: false,
      check: async () => {
        try {
          const cacheManager = getCacheManager();
          const cacheHealth = await cacheManager.healthCheck();
          
          const status = cacheHealth.healthy ? 'healthy' : 
                        (cacheHealth.l1.healthy ? 'degraded' : 'unhealthy');
          
          return {
            healthy: cacheHealth.healthy,
            status,
            message: cacheHealth.healthy ? 'Cache system is healthy' : 
                    (cacheHealth.l1.healthy ? 'Cache running on memory only' : 'Cache system unavailable'),
            details: {
              l1Cache: cacheHealth.l1,
              l2Cache: cacheHealth.l2,
            },
            timestamp: new Date(),
          };
        } catch (error) {
          return {
            healthy: false,
            status: 'unhealthy' as const,
            message: `Cache check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
          };
        }
      },
    });

    // Memory health check
    this.register({
      name: 'memory',
      description: 'System memory usage',
      critical: false,
      check: async () => {
        const memUsage = process.memoryUsage();
        const totalMem = memUsage.heapTotal;
        const usedMem = memUsage.heapUsed;
        const memoryUsagePercentage = (usedMem / totalMem) * 100;
        
        const healthy = memoryUsagePercentage < 90;
        const status = memoryUsagePercentage < 70 ? 'healthy' : 
                      memoryUsagePercentage < 90 ? 'degraded' : 'unhealthy';
        
        return {
          healthy,
          status,
          message: `Memory usage: ${memoryUsagePercentage.toFixed(1)}%`,
          details: {
            heapUsed: `${(usedMem / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(totalMem / 1024 / 1024).toFixed(2)} MB`,
            external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
            usagePercentage: `${memoryUsagePercentage.toFixed(1)}%`,
          },
          timestamp: new Date(),
        };
      },
    });

    // API endpoints health check
    this.register({
      name: 'api',
      description: 'Core API endpoints availability',
      critical: true,
      check: async () => {
        const endpoints = ['/api/health', '/api/status'];
        const results: any[] = [];
        
        for (const endpoint of endpoints) {
          try {
            const startTime = Date.now();
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${endpoint}`, {
              method: 'GET',
              timeout: 5000,
            });
            const responseTime = Date.now() - startTime;
            
            results.push({
              endpoint,
              status: response.status,
              responseTime,
              healthy: response.ok,
            });
          } catch (error) {
            results.push({
              endpoint,
              status: 0,
              responseTime: -1,
              healthy: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        
        const healthyEndpoints = results.filter(r => r.healthy).length;
        const healthy = healthyEndpoints === endpoints.length;
        const status = healthyEndpoints === 0 ? 'unhealthy' : 
                      healthyEndpoints < endpoints.length ? 'degraded' : 'healthy';
        
        return {
          healthy,
          status,
          message: `${healthyEndpoints}/${endpoints.length} API endpoints healthy`,
          details: {
            endpoints: results,
            healthyCount: healthyEndpoints,
            totalCount: endpoints.length,
          },
          timestamp: new Date(),
        };
      },
    });

    // External services health check
    this.register({
      name: 'external-services',
      description: 'External service dependencies',
      critical: false,
      check: async () => {
        const services = [
          { name: 'Clerk', url: 'https://api.clerk.com/v1/health' },
          { name: 'Stripe', url: 'https://status.stripe.com/api/v2/status.json' },
          { name: 'Convex', url: 'https://status.convex.dev/api/v2/status.json' },
        ];
        
        const results: any[] = [];
        
        for (const service of services) {
          try {
            const startTime = Date.now();
            const response = await fetch(service.url, {
              method: 'GET',
              timeout: 3000,
            });
            const responseTime = Date.now() - startTime;
            
            results.push({
              name: service.name,
              healthy: response.ok,
              responseTime,
              status: response.status,
            });
          } catch (error) {
            results.push({
              name: service.name,
              healthy: false,
              responseTime: -1,
              status: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        
        const healthyServices = results.filter(r => r.healthy).length;
        const healthy = healthyServices >= services.length * 0.8; // At least 80% healthy
        const status = healthyServices === services.length ? 'healthy' :
                      healthyServices >= services.length * 0.5 ? 'degraded' : 'unhealthy';
        
        return {
          healthy,
          status,
          message: `${healthyServices}/${services.length} external services healthy`,
          details: {
            services: results,
            healthyCount: healthyServices,
            totalCount: services.length,
          },
          timestamp: new Date(),
        };
      },
    });

    // Error monitoring health check
    this.register({
      name: 'monitoring',
      description: 'Error monitoring and logging systems',
      critical: false,
      check: async () => {
        const sentry = getSentry();
        const sentryHealth = sentry ? await sentry.healthCheck() : null;
        const loggerHealth = this.logger.healthCheck();
        
        const healthy = (sentryHealth?.healthy !== false) && loggerHealth.healthy;
        const status = healthy ? 'healthy' : 'degraded';
        
        return {
          healthy,
          status,
          message: healthy ? 'Monitoring systems operational' : 'Some monitoring issues detected',
          details: {
            sentry: sentryHealth,
            logger: loggerHealth,
          },
          timestamp: new Date(),
        };
      },
    });
  }

  register(check: HealthCheck): void {
    this.checks.set(check.name, check);
    if (!this.results.has(check.name)) {
      this.results.set(check.name, []);
    }
    
    this.logger.info(`Health check registered: ${check.name}`, {
      description: check.description,
      critical: check.critical,
      timeout: check.timeout || this.config.timeout,
    });
  }

  unregister(name: string): void {
    this.checks.delete(name);
    this.results.delete(name);
    this.logger.info(`Health check unregistered: ${name}`);
  }

  getCheckNames(): string[] {
    return Array.from(this.checks.keys());
  }

  private async runCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timeout = check.timeout || this.config.timeout;
    
    try {
      // Run the check with timeout
      const result = await Promise.race([
        check.check(),
        new Promise<HealthCheckResult>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        ),
      ]);
      
      const responseTime = Date.now() - startTime;
      return {
        ...result,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: false,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed',
        responseTime,
        timestamp: new Date(),
        details: {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : error,
        },
      };
    }
  }

  private async runCheckWithRetries(check: HealthCheck): Promise<HealthCheckResult> {
    let lastResult: HealthCheckResult;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      lastResult = await this.runCheck(check);
      
      if (lastResult.healthy) {
        return lastResult;
      }
      
      if (attempt < this.config.retries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return lastResult!;
  }

  async runSingle(name: string): Promise<HealthCheckResult | null> {
    const check = this.checks.get(name);
    if (!check) {
      return null;
    }
    
    const result = await this.runCheckWithRetries(check);
    
    // Store result
    const results = this.results.get(name) || [];
    results.push(result);
    
    // Keep only last 100 results
    if (results.length > 100) {
      results.splice(0, results.length - 100);
    }
    
    this.results.set(name, results);
    
    // Log if unhealthy and critical
    if (!result.healthy && check.critical) {
      this.logger.error(`Critical health check failed: ${name}`, undefined, {
        check: check.name,
        result,
      });
    } else if (!result.healthy) {
      this.logger.warn(`Health check failed: ${name}`, {
        check: check.name,
        result,
      });
    }
    
    return result;
  }

  async runAll(): Promise<SystemHealth> {
    const checkNames = Array.from(this.checks.keys());
    const results: Record<string, HealthCheckResult> = {};
    
    // Run all checks in parallel
    await Promise.all(
      checkNames.map(async (name) => {
        const result = await this.runSingle(name);
        if (result) {
          results[name] = result;
        }
      })
    );
    
    // Determine overall health
    const criticalChecks = Array.from(this.checks.values()).filter(c => c.critical);
    const allResults = Object.values(results);
    const criticalResults = criticalChecks.map(c => results[c.name]).filter(Boolean);
    
    const allHealthy = allResults.every(r => r.healthy);
    const criticalHealthy = criticalResults.every(r => r.healthy);
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    
    if (!criticalHealthy) {
      overall = 'unhealthy';
    } else if (!allHealthy) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }
    
    const uptime = Date.now() - this.startTime;
    
    const systemHealth: SystemHealth = {
      overall,
      checks: results,
      timestamp: new Date(),
      uptime,
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
    };
    
    // Log system health summary
    this.logger.info('System health check completed', {
      overall,
      totalChecks: allResults.length,
      healthyChecks: allResults.filter(r => r.healthy).length,
      criticalChecks: criticalResults.length,
      healthyCriticalChecks: criticalResults.filter(r => r.healthy).length,
      uptime: `${Math.round(uptime / 1000)}s`,
    });
    
    return systemHealth;
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }
    
    this.logger.info('Starting health monitoring', {
      interval: this.config.interval,
      checks: Array.from(this.checks.keys()),
    });
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runAll();
      } catch (error) {
        this.logger.error('Health monitoring cycle failed', error as Error);
      }
    }, this.config.interval);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      this.logger.info('Health monitoring stopped');
    }
  }

  getHistory(name: string, limit = 50): HealthCheckResult[] {
    const results = this.results.get(name) || [];
    return results.slice(-limit);
  }

  getMetrics(name: string): {
    uptime: number;
    successRate: number;
    averageResponseTime: number;
    lastFailure?: Date;
  } {
    const history = this.getHistory(name, 100);
    
    if (history.length === 0) {
      return {
        uptime: 0,
        successRate: 0,
        averageResponseTime: 0,
      };
    }
    
    const successes = history.filter(r => r.healthy).length;
    const successRate = (successes / history.length) * 100;
    
    const responseTimes = history
      .filter(r => r.responseTime !== undefined)
      .map(r => r.responseTime!);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const failures = history.filter(r => !r.healthy);
    const lastFailure = failures.length > 0
      ? failures[failures.length - 1].timestamp
      : undefined;
    
    const uptime = history.length > 0
      ? (Date.now() - history[0].timestamp.getTime()) / 1000
      : 0;
    
    return {
      uptime,
      successRate,
      averageResponseTime,
      lastFailure,
    };
  }

  async generateReport(): Promise<string> {
    const systemHealth = await this.runAll();
    const timestamp = new Date().toISOString();
    
    let report = `
🏥 System Health Report - ${timestamp}
${'='.repeat(60)}

📊 Overall Status: ${systemHealth.overall.toUpperCase()}
⏱️  System Uptime: ${Math.round(systemHealth.uptime / 1000 / 60)} minutes
🔧 Environment: ${systemHealth.environment}
📦 Version: ${systemHealth.version || 'unknown'}

📋 Health Checks:
`;

    for (const [name, result] of Object.entries(systemHealth.checks)) {
      const check = this.checks.get(name);
      const status = result.status.toUpperCase();
      const icon = result.healthy ? '✅' : (result.status === 'degraded' ? '⚠️' : '❌');
      const critical = check?.critical ? ' (CRITICAL)' : '';
      const responseTime = result.responseTime ? ` (${result.responseTime}ms)` : '';
      
      report += `   ${icon} ${name}${critical}: ${status}${responseTime}\n`;
      report += `      ${result.message}\n`;
      
      if (result.details) {
        const details = JSON.stringify(result.details, null, 6).replace(/\n/g, '\n      ');
        report += `      Details: ${details}\n`;
      }
      report += '\n';
    }

    const metrics = Array.from(this.checks.keys()).map(name => ({
      name,
      ...this.getMetrics(name),
    }));

    report += `📈 Metrics (last 100 checks):
`;
    
    for (const metric of metrics) {
      report += `   ${metric.name}:
      Success Rate: ${metric.successRate.toFixed(1)}%
      Avg Response Time: ${metric.averageResponseTime.toFixed(1)}ms
      Uptime: ${Math.round(metric.uptime / 60)} minutes
`;
      if (metric.lastFailure) {
        report += `      Last Failure: ${metric.lastFailure.toISOString()}\n`;
      }
      report += '\n';
    }

    return report;
  }

  // Health check for the monitor itself
  healthCheck(): {
    healthy: boolean;
    monitoring: boolean;
    checksRegistered: number;
    lastRun?: Date;
  } {
    const lastResults = Array.from(this.results.values()).flat();
    const lastRun = lastResults.length > 0
      ? new Date(Math.max(...lastResults.map(r => r.timestamp.getTime())))
      : undefined;
    
    return {
      healthy: true,
      monitoring: this.monitoringInterval !== undefined,
      checksRegistered: this.checks.size,
      lastRun,
    };
  }
}

// Global health monitor instance
let globalHealthMonitor: HealthMonitor | undefined;

export function getHealthMonitor(config?: Partial<HealthMonitorConfig>): HealthMonitor {
  if (!globalHealthMonitor) {
    globalHealthMonitor = new HealthMonitor(config);
  }
  return globalHealthMonitor;
}

export function initializeHealthMonitoring(config?: Partial<HealthMonitorConfig>): HealthMonitor {
  const monitor = getHealthMonitor(config);
  monitor.startMonitoring();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    monitor.stopMonitoring();
  });
  
  process.on('SIGTERM', () => {
    monitor.stopMonitoring();
  });
  
  return monitor;
}