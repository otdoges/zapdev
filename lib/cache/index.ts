// Comprehensive caching system for zapdev
// Multi-layer cache with Redis, memory cache, CDN integration, and smart invalidation

export { RedisCache, getRedisClient } from './redis-client';
export { 
  MultiLayerCache, 
  getCache, 
  cached, 
  type CacheOptions, 
  type CacheStats 
} from './multi-layer-cache';
export { 
  CacheManager, 
  getCacheManager, 
  createCacheInvalidationMiddleware 
} from './cache-strategies';
export { 
  CDNManager, 
  getCDNManager, 
  createCDNImageLoader, 
  createCDNHeaders 
} from './cdn-integration';

import { getCacheManager } from './cache-strategies';
import { getCDNManager } from './cdn-integration';

// Main cache system initialization
export async function initializeCacheSystem(options?: {
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  memory?: {
    maxSize?: number;
    ttl?: number;
  };
  cdn?: {
    provider: 'cloudflare' | 'fastly' | 'aws' | 'custom';
    apiKey?: string;
    baseUrl: string;
  };
  warmup?: boolean;
}): Promise<{
  success: boolean;
  cacheManager: any;
  cdnManager?: any;
  stats: any;
}> {
  try {
    console.log('🚀 Initializing comprehensive cache system...');
    
    // Initialize cache manager with Redis and memory cache
    const cacheManager = getCacheManager({
      cacheConfig: {
        ...options?.memory,
        redisConfig: options?.redis,
      },
      warmupConfig: {
        enabled: options?.warmup !== false,
      },
    });

    // Initialize CDN manager if configured
    let cdnManager;
    if (options?.cdn) {
      cdnManager = getCDNManager(options.cdn);
    }

    // Perform health checks
    const cacheHealth = await cacheManager.healthCheck();
    const cdnHealth = cdnManager ? await cdnManager.healthCheck() : null;

    console.log('💚 Cache Health:', cacheHealth.healthy ? 'HEALTHY' : 'UNHEALTHY');
    if (cdnHealth) {
      console.log('🌐 CDN Health:', cdnHealth.healthy ? 'HEALTHY' : 'UNHEALTHY');
    }

    // Warm up cache if enabled
    if (options?.warmup !== false) {
      const warmupResult = await cacheManager.warmupCache();
      console.log(`🔥 Cache warmup: ${warmupResult.warmedKeys} keys in ${warmupResult.duration}ms`);
    }

    // Get initial stats
    const stats = cacheManager.getStats();
    
    console.log('✅ Cache system initialization completed');
    console.log(`📊 L1 Cache: ${stats.l1.size}/${stats.l1.maxSize} entries`);
    console.log(`📊 L2 Cache: ${stats.l2.connected ? 'Connected' : 'Disconnected'}`);

    return {
      success: true,
      cacheManager,
      cdnManager,
      stats,
    };
  } catch (error) {
    console.error('❌ Cache system initialization failed:', error);
    return {
      success: false,
      cacheManager: null,
      cdnManager: null,
      stats: null,
    };
  }
}

// Cache system middleware for API routes
export function createCacheMiddleware(options?: {
  defaultTtl?: number;
  skipPaths?: string[];
  varyByHeaders?: string[];
}) {
  const cacheManager = getCacheManager();
  const defaultTtl = options?.defaultTtl || 300; // 5 minutes
  const skipPaths = options?.skipPaths || ['/api/auth', '/api/webhook'];
  const varyByHeaders = options?.varyByHeaders || ['authorization', 'user-agent'];

  return async function cacheMiddleware(req: any, res: any, next: any) {
    // Skip caching for certain paths
    if (skipPaths.some(path => req.url?.startsWith(path))) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key based on URL and varying headers
    const varyValues = varyByHeaders
      .map(header => `${header}:${req.headers[header] || ''}`)
      .join('|');
    const cacheKey = `api:${req.url}:${varyValues}`;

    try {
      // Try to get from cache
      const cached = await cacheManager.getCache().get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        res.setHeader('Content-Type', cached.contentType || 'application/json');
        return res.status(cached.status || 200).send(cached.data);
      }

      // Cache miss - capture response
      const originalSend = res.send;
      const originalStatus = res.status;
      let responseData: any;
      let statusCode = 200;

      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      res.send = function(data: any) {
        responseData = data;
        
        // Cache successful responses
        if (statusCode >= 200 && statusCode < 300) {
          cacheManager.getCache().set(cacheKey, {
            data: responseData,
            status: statusCode,
            contentType: res.getHeader('content-type'),
            timestamp: new Date().toISOString(),
          }, { ttl: defaultTtl });
        }

        res.setHeader('X-Cache-Status', 'MISS');
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

// Performance monitoring and alerts
export class CachePerformanceMonitor {
  private cacheManager: any;
  private cdnManager?: any;
  private alertThresholds = {
    hitRateMin: 70, // Minimum acceptable hit rate percentage
    avgResponseTimeMax: 100, // Maximum acceptable response time in ms
    errorRateMax: 5, // Maximum acceptable error rate percentage
    memoryUsageMax: 90, // Maximum memory usage percentage
  };

  constructor(cacheManager: any, cdnManager?: any) {
    this.cacheManager = cacheManager;
    this.cdnManager = cdnManager;
  }

  async collectMetrics(): Promise<{
    cache: any;
    cdn?: any;
    alerts: string[];
  }> {
    const alerts: string[] = [];
    
    // Cache metrics
    const cacheStats = this.cacheManager.getStats();
    const cacheHealth = await this.cacheManager.healthCheck();
    
    // Check cache performance
    const l1HitRate = cacheStats.l1.hits + cacheStats.l1.misses > 0 
      ? (cacheStats.l1.hits / (cacheStats.l1.hits + cacheStats.l1.misses)) * 100 
      : 0;
    
    if (l1HitRate < this.alertThresholds.hitRateMin) {
      alerts.push(`L1 cache hit rate is low: ${l1HitRate.toFixed(1)}%`);
    }

    if (cacheStats.performance.avgGetTime > this.alertThresholds.avgResponseTimeMax) {
      alerts.push(`Cache response time is high: ${cacheStats.performance.avgGetTime.toFixed(1)}ms`);
    }

    const memoryUsage = (cacheStats.l1.size / cacheStats.l1.maxSize) * 100;
    if (memoryUsage > this.alertThresholds.memoryUsageMax) {
      alerts.push(`Memory cache usage is high: ${memoryUsage.toFixed(1)}%`);
    }

    // CDN metrics
    let cdnStats;
    if (this.cdnManager) {
      cdnStats = await this.cdnManager.healthCheck();
      
      if (!cdnStats.healthy) {
        alerts.push('CDN is not reachable');
      }
    }

    return {
      cache: {
        stats: cacheStats,
        health: cacheHealth,
        hitRate: l1HitRate,
        memoryUsage,
      },
      cdn: cdnStats,
      alerts,
    };
  }

  async generateReport(): Promise<string> {
    const metrics = await this.collectMetrics();
    const timestamp = new Date().toISOString();
    
    let report = `
📊 Cache Performance Report - ${timestamp}
${'='.repeat(50)}

🏎️  Cache Performance:
   L1 Hit Rate: ${metrics.cache.hitRate.toFixed(1)}%
   L1 Memory Usage: ${metrics.cache.memoryUsage.toFixed(1)}%
   Avg Response Time: ${metrics.cache.stats.performance.avgGetTime.toFixed(1)}ms
   Total Operations: ${metrics.cache.stats.performance.totalOperations}

🔍 Cache Health:
   L1 Cache: ${metrics.cache.health.l1.healthy ? '✅ Healthy' : '❌ Unhealthy'}
   L2 Cache: ${metrics.cache.health.l2.healthy ? '✅ Connected' : '❌ Disconnected'}
`;

    if (this.cdnManager && metrics.cdn) {
      report += `
🌐 CDN Status:
   CDN Health: ${metrics.cdn.healthy ? '✅ Healthy' : '❌ Unhealthy'}
   Assets Optimized: ${metrics.cdn.assetsOptimized}/${metrics.cdn.totalAssets}
`;
    }

    if (metrics.alerts.length > 0) {
      report += `
🚨 Alerts:
${metrics.alerts.map(alert => `   ⚠️  ${alert}`).join('\n')}
`;
    } else {
      report += `
✅ No alerts - All systems performing well!
`;
    }

    return report;
  }

  startMonitoring(intervalMinutes: number = 5): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        
        if (metrics.alerts.length > 0) {
          console.warn('🚨 Cache Performance Alerts:');
          metrics.alerts.forEach(alert => console.warn(`   ⚠️  ${alert}`));
        } else {
          console.log(`✅ Cache system healthy - Hit rate: ${metrics.cache.hitRate.toFixed(1)}%`);
        }
      } catch (error) {
        console.error('Cache monitoring error:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Utility functions
export async function getCacheInfo(): Promise<{
  cache: any;
  cdn?: any;
  recommendations: string[];
}> {
  const cacheManager = getCacheManager();
  const cacheStats = cacheManager.getStats();
  const cacheHealth = await cacheManager.healthCheck();
  
  const recommendations: string[] = [];
  
  // Generate recommendations based on performance
  const hitRate = cacheStats.l1.hits + cacheStats.l1.misses > 0 
    ? (cacheStats.l1.hits / (cacheStats.l1.hits + cacheStats.l1.misses)) * 100 
    : 0;
  
  if (hitRate < 60) {
    recommendations.push('Consider adjusting cache TTL or warming up more data');
  }
  
  if (!cacheHealth.l2.connected) {
    recommendations.push('Consider setting up Redis for better cache performance');
  }
  
  if (cacheStats.l1.size >= cacheStats.l1.maxSize * 0.8) {
    recommendations.push('Consider increasing memory cache size');
  }

  return {
    cache: {
      stats: cacheStats,
      health: cacheHealth,
      hitRate,
    },
    recommendations,
  };
}

export function createCachePerformanceMonitor() {
  const cacheManager = getCacheManager();
  const cdnManager = globalCDNManager;
  
  return new CachePerformanceMonitor(cacheManager, cdnManager);
}

// Make CDN manager available globally (for performance monitor)
let globalCDNManager: any;
export function setCDNManager(cdnManager: any) {
  globalCDNManager = cdnManager;
}