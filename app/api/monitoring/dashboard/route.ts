import { NextRequest, NextResponse } from 'next/server';
import { getHealthMonitor } from '@/lib/monitoring/health-checks';
import { getLogger } from '@/lib/monitoring/logger';
import { getCacheManager } from '@/lib/cache/cache-strategies';
import { getSentry } from '@/lib/monitoring/sentry-config';
import { getDatabaseStats } from '@/lib/database/connection-enhanced';

const logger = getLogger();

export async function GET(request: NextRequest) {
  try {
    // Check authentication/authorization if needed
    // const session = await getServerSession();
    // if (!session?.user?.role?.includes('admin')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    logger.info('Monitoring dashboard requested');

    // Collect data from all monitoring systems
    const [
      systemHealth,
      loggerStats,
      cacheStats,
      databaseStats,
      sentryHealth
    ] = await Promise.allSettled([
      getHealthMonitor().runAll(),
      logger.getStats(),
      getCacheManager().getStats(),
      getDatabaseStats().catch(() => null),
      getSentry()?.healthCheck().catch(() => null) || null,
    ]);

    // Process results
    const dashboard = {
      timestamp: new Date(),
      status: systemHealth.status === 'fulfilled' ? systemHealth.value.overall : 'unknown',
      
      // System Health
      health: systemHealth.status === 'fulfilled' ? {
        overall: systemHealth.value.overall,
        uptime: systemHealth.value.uptime,
        checks: Object.entries(systemHealth.value.checks).map(([name, result]) => ({
          name,
          status: result.status,
          message: result.message,
          responseTime: result.responseTime,
          timestamp: result.timestamp,
        })),
        metrics: Array.from(getHealthMonitor().checks.keys()).map(name => ({
          name,
          ...getHealthMonitor().getMetrics(name),
        })),
      } : null,

      // Logging System
      logging: loggerStats.status === 'fulfilled' ? {
        healthy: loggerStats.value.healthy,
        totalLogs: loggerStats.value.totalLogs,
        logsByLevel: loggerStats.value.logsByLevel,
        recentErrors: loggerStats.value.recentErrors,
        memoryUsage: loggerStats.value.memoryUsage,
        lastError: loggerStats.value.lastError,
      } : null,

      // Cache System
      cache: cacheStats.status === 'fulfilled' ? {
        l1: {
          hits: cacheStats.value.l1.hits,
          misses: cacheStats.value.l1.misses,
          hitRate: cacheStats.value.l1.hits + cacheStats.value.l1.misses > 0
            ? ((cacheStats.value.l1.hits / (cacheStats.value.l1.hits + cacheStats.value.l1.misses)) * 100).toFixed(1)
            : '0.0',
          size: cacheStats.value.l1.size,
          maxSize: cacheStats.value.l1.maxSize,
          usagePercent: ((cacheStats.value.l1.size / cacheStats.value.l1.maxSize) * 100).toFixed(1),
        },
        l2: {
          hits: cacheStats.value.l2.hits,
          misses: cacheStats.value.l2.misses,
          hitRate: cacheStats.value.l2.hits + cacheStats.value.l2.misses > 0
            ? ((cacheStats.value.l2.hits / (cacheStats.value.l2.hits + cacheStats.value.l2.misses)) * 100).toFixed(1)
            : '0.0',
          connected: cacheStats.value.l2.connected,
        },
        performance: {
          avgGetTime: cacheStats.value.performance.avgGetTime?.toFixed(2) || '0',
          avgSetTime: cacheStats.value.performance.avgSetTime?.toFixed(2) || '0',
          totalOperations: cacheStats.value.performance.totalOperations,
        },
      } : null,

      // Database System
      database: databaseStats.status === 'fulfilled' && databaseStats.value ? {
        tables: databaseStats.value.tables.map(table => ({
          name: table.name,
          rowCount: table.rowCount,
          size: table.size,
        })),
        indexes: databaseStats.value.indexes.map(index => ({
          name: index.name,
          table: index.table,
        })),
        performance: {
          slowQueries: databaseStats.value.performance.slowQueries.map(query => ({
            query: query.query,
            duration: query.duration,
            timestamp: query.timestamp,
          })),
          poolStats: databaseStats.value.performance.poolStats,
        },
      } : null,

      // Error Monitoring
      monitoring: sentryHealth ? {
        sentry: {
          healthy: sentryHealth.healthy,
          initialized: sentryHealth.initialized,
          environment: sentryHealth.environment,
          dsn: sentryHealth.dsn,
        },
      } : null,

      // System Information
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV,
        memory: {
          heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
          external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        },
        uptime: `${Math.floor(process.uptime() / 60)} minutes`,
      },

      // Performance Metrics
      performance: {
        responseTime: Date.now(),
        cpu: process.cpuUsage(),
        eventLoopLag: await measureEventLoopLag(),
      },
    };

    // Calculate response time
    dashboard.performance.responseTime = Date.now() - dashboard.performance.responseTime;

    logger.info('Monitoring dashboard data collected', {
      healthStatus: dashboard.status,
      responseTime: dashboard.performance.responseTime,
      componentsChecked: [
        dashboard.health ? 'health' : null,
        dashboard.logging ? 'logging' : null,
        dashboard.cache ? 'cache' : null,
        dashboard.database ? 'database' : null,
        dashboard.monitoring ? 'monitoring' : null,
      ].filter(Boolean).length,
    });

    return NextResponse.json(dashboard, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Monitoring-Status': dashboard.status,
      },
    });
  } catch (error) {
    logger.error('Monitoring dashboard failed', error as Error);
    
    return NextResponse.json({
      error: 'Failed to generate monitoring dashboard',
      timestamp: new Date(),
      message: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : 'Internal server error',
    }, { status: 500 });
  }
}

// Measure event loop lag
async function measureEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
      resolve(lag);
    });
  });
}