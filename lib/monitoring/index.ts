// Comprehensive monitoring and error tracking system for zapdev
// Includes Sentry integration, structured logging, health checks, and performance monitoring

export { 
  SentryManager,
  initializeSentry, 
  getSentry,
  withSentryErrorBoundary,
  Sentry,
  type ErrorContext,
  type SentryConfig,
} from './sentry-config';

export { 
  StructuredLogger,
  ContextualLogger,
  initializeLogger,
  getLogger,
  logger,
  LogLevel,
  type LogEntry,
} from './logger';

export {
  HealthMonitor,
  getHealthMonitor,
  initializeHealthMonitoring,
  type HealthCheck,
  type HealthCheckResult,
  type SystemHealth,
} from './health-checks';

import { initializeSentry } from './sentry-config';
import { initializeLogger } from './logger';
import { initializeHealthMonitoring } from './health-checks';

// Comprehensive monitoring system initialization
export async function initializeMonitoringSystem(options?: {
  sentry?: {
    dsn?: string;
    environment?: string;
    release?: string;
    sampleRate?: number;
    tracesSampleRate?: number;
    enableTracing?: boolean;
    enableProfiler?: boolean;
  };
  logging?: {
    level?: number;
    enableConsole?: boolean;
    enableSentry?: boolean;
    enableFile?: boolean;
    enableDatabase?: boolean;
    redactSensitive?: boolean;
  };
  healthChecks?: {
    interval?: number;
    timeout?: number;
    retries?: number;
    enableNotifications?: boolean;
  };
  startMonitoring?: boolean;
}): Promise<{
  success: boolean;
  sentry: any;
  logger: any;
  healthMonitor: any;
  errors: string[];
}> {
  const errors: string[] = [];
  let sentry, logger, healthMonitor;

  try {
    console.log('🔍 Initializing comprehensive monitoring system...');

    // Initialize Sentry error tracking
    try {
      sentry = initializeSentry({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
        ...options?.sentry,
      });
      console.log('✅ Sentry error tracking initialized');
    } catch (error) {
      const errorMsg = `Sentry initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('⚠️ ', errorMsg);
    }

    // Initialize structured logging
    try {
      logger = initializeLogger({
        level: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : 1, // INFO level
        enableConsole: process.env.NODE_ENV !== 'test',
        enableSentry: !!sentry,
        enableFile: process.env.LOG_TO_FILE === 'true',
        enableDatabase: process.env.LOG_TO_DATABASE === 'true',
        redactSensitive: process.env.NODE_ENV === 'production',
        ...options?.logging,
      });
      console.log('✅ Structured logging initialized');
      
      logger.info('Monitoring system initialization started', {
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMsg = `Logger initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('⚠️ ', errorMsg);
    }

    // Initialize health monitoring
    try {
      healthMonitor = initializeHealthMonitoring({
        interval: 30000, // 30 seconds
        timeout: 10000, // 10 seconds
        retries: 3,
        enableNotifications: true,
        enableMetrics: true,
        alertThresholds: {
          responseTime: 5000,
          errorRate: 0.1,
          uptimePercentage: 99.0,
        },
        ...options?.healthChecks,
      });
      console.log('✅ Health monitoring initialized');
      
      if (logger) {
        logger.info('Health monitoring system started', {
          interval: options?.healthChecks?.interval || 30000,
          checks: Array.from(healthMonitor.checks?.keys() || []),
        });
      }
    } catch (error) {
      const errorMsg = `Health monitoring initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('⚠️ ', errorMsg);
    }

    // Set up global error handlers
    setupGlobalErrorHandlers(sentry, logger);

    // Set up graceful shutdown
    setupGracefulShutdown(sentry, logger, healthMonitor);

    const success = errors.length === 0;
    
    if (success) {
      console.log('🎉 Monitoring system initialization completed successfully');
      if (logger) {
        logger.info('Monitoring system fully operational', {
          components: ['sentry', 'logger', 'healthMonitor'].filter(comp => 
            comp === 'sentry' ? !!sentry : 
            comp === 'logger' ? !!logger : 
            comp === 'healthMonitor' ? !!healthMonitor : false
          ),
          errors: [],
        });
      }
    } else {
      console.warn(`⚠️ Monitoring system initialized with ${errors.length} warnings`);
      if (logger) {
        logger.warn('Monitoring system initialized with issues', {
          errors,
          partiallyOperational: true,
        });
      }
    }

    return {
      success,
      sentry,
      logger,
      healthMonitor,
      errors,
    };
  } catch (error) {
    const criticalError = `Critical monitoring system failure: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('❌ ', criticalError);
    errors.push(criticalError);
    
    return {
      success: false,
      sentry,
      logger,
      healthMonitor,
      errors,
    };
  }
}

// Set up global error handlers
function setupGlobalErrorHandlers(sentry: any, logger: any): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    
    if (logger) {
      logger.fatal('Uncaught exception occurred', error, {
        type: 'uncaughtException',
        fatal: true,
      });
    }
    
    if (sentry) {
      sentry.captureException(error, {
        tags: { type: 'uncaughtException' },
        level: 'fatal',
      });
    }
    
    // Give some time for logging/reporting before exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    if (logger) {
      logger.error('Unhandled promise rejection', error, {
        type: 'unhandledRejection',
        reason: String(reason),
      });
    }
    
    if (sentry) {
      sentry.captureException(error, {
        tags: { type: 'unhandledRejection' },
        level: 'error',
        extra: { promise: promise.toString() },
      });
    }
  });

  // Handle warnings
  process.on('warning', (warning) => {
    if (logger) {
      logger.warn('Process warning', undefined, {
        type: 'processWarning',
        warningName: warning.name,
        warningMessage: warning.message,
        warningStack: warning.stack,
      });
    }
  });
}

// Set up graceful shutdown
function setupGracefulShutdown(sentry: any, logger: any, healthMonitor: any): void {
  const shutdown = async (signal: string) => {
    console.log(`\n📴 Graceful shutdown initiated (${signal})`);
    
    if (logger) {
      logger.info('Graceful shutdown initiated', {
        signal,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Stop health monitoring
      if (healthMonitor) {
        healthMonitor.stopMonitoring();
        console.log('✅ Health monitoring stopped');
      }

      // Flush logger
      if (logger) {
        await logger.flush();
        console.log('✅ Logger flushed');
      }

      // Close Sentry
      if (sentry) {
        await sentry.close(2000);
        console.log('✅ Sentry client closed');
      }

      console.log('🎯 Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Listen for shutdown signals
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));
}

// Monitoring system health check
export async function checkMonitoringHealth(): Promise<{
  healthy: boolean;
  components: {
    sentry: boolean;
    logger: boolean;
    healthMonitor: boolean;
  };
  details: any;
}> {
  try {
    const sentry = await import('./sentry-config').then(m => m.getSentry());
    const logger = await import('./logger').then(m => m.getLogger());
    const healthMonitor = await import('./health-checks').then(m => m.getHealthMonitor());

    const sentryHealth = sentry ? await sentry.healthCheck() : null;
    const loggerHealth = logger ? logger.healthCheck() : null;
    const healthMonitorHealth = healthMonitor ? healthMonitor.healthCheck() : null;

    const components = {
      sentry: sentryHealth?.healthy !== false,
      logger: loggerHealth?.healthy !== false,
      healthMonitor: healthMonitorHealth?.healthy !== false,
    };

    const healthy = Object.values(components).every(Boolean);

    return {
      healthy,
      components,
      details: {
        sentry: sentryHealth,
        logger: loggerHealth,
        healthMonitor: healthMonitorHealth,
      },
    };
  } catch (error) {
    return {
      healthy: false,
      components: {
        sentry: false,
        logger: false,
        healthMonitor: false,
      },
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Performance monitoring utilities
export const performanceMonitoring = {
  // Time a function execution
  time: async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    const logger = await import('./logger').then(m => m.getLogger());
    const sentry = await import('./sentry-config').then(m => m.getSentry());
    
    const start = process.hrtime.bigint();
    const transaction = sentry?.startTransaction({ name, op: 'function' });
    
    try {
      const result = await fn();
      const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
      
      transaction?.setStatus('ok');
      logger?.debug('Performance measurement', {
        operation: name,
        duration: `${duration.toFixed(2)}ms`,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - start) / 1000000;
      
      transaction?.setStatus('internal_error');
      logger?.warn('Performance measurement (with error)', undefined, error as Error);
      
      throw error;
    } finally {
      transaction?.finish();
    }
  },

  // Mark important events
  mark: async (name: string, data?: Record<string, any>) => {
    const logger = await import('./logger').then(m => m.getLogger());
    const sentry = await import('./sentry-config').then(m => m.getSentry());
    
    logger?.info(`Performance mark: ${name}`, data);
    sentry?.addBreadcrumb({
      message: name,
      level: 'info',
      category: 'performance',
      data,
    });
  },
};

// Export monitoring middleware factory
export function createMonitoringMiddleware() {
  return async (req: any, res: any, next: any) => {
    const startTime = process.hrtime.bigint();
    const logger = await import('./logger').then(m => m.getLogger());
    const sentry = await import('./sentry-config').then(m => m.getSentry());
    
    const transaction = sentry?.startTransaction({
      name: `${req.method} ${req.route?.path || req.url}`,
      op: 'http.server',
    });
    
    // Add request context
    const requestId = req.headers['x-request-id'] || Math.random().toString(36);
    const contextualLogger = logger?.child({
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    });
    
    // Attach logger to request
    req.logger = contextualLogger;
    req.transaction = transaction;
    
    contextualLogger?.info('Request started');
    
    // Override res.end to capture response metrics
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      contextualLogger?.info('Request completed', {
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
      });
      
      transaction?.setHttpStatus(res.statusCode);
      transaction?.finish();
      
      return originalEnd.apply(this, args);
    };
    
    next();
  };
}