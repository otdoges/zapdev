import { RedisCache, getRedisClient } from './redis-client';
import { LRUCache } from 'lru-cache';
import { performance } from 'perf_hooks';

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  skipMemory?: boolean;
  skipRedis?: boolean;
  namespace?: string;
}

interface CacheStats {
  l1: {
    hits: number;
    misses: number;
    sets: number;
    size: number;
    maxSize: number;
  };
  l2: {
    hits: number;
    misses: number;
    sets: number;
    connected: boolean;
  };
  performance: {
    avgGetTime: number;
    avgSetTime: number;
    totalOperations: number;
  };
}

type CacheInvalidationPattern = 
  | string 
  | RegExp 
  | ((key: string, value: any) => boolean);

export class MultiLayerCache {
  private l1Cache: LRUCache<string, any>; // Memory cache (L1)
  private l2Cache: RedisCache; // Redis cache (L2)
  private namespace: string;
  private stats: CacheStats;

  constructor(options: {
    memoryMaxSize?: number;
    memoryTtl?: number;
    redisConfig?: any;
    namespace?: string;
  } = {}) {
    this.namespace = options.namespace || 'cache';
    
    // Initialize L1 cache (memory)
    this.l1Cache = new LRUCache({
      max: options.memoryMaxSize || 1000,
      ttl: (options.memoryTtl || 300) * 1000, // Convert to milliseconds
      updateAgeOnGet: true,
      allowStale: false,
    });

    // Initialize L2 cache (Redis)
    this.l2Cache = getRedisClient(options.redisConfig);

    // Initialize stats
    this.stats = {
      l1: {
        hits: 0,
        misses: 0,
        sets: 0,
        size: 0,
        maxSize: options.memoryMaxSize || 1000,
      },
      l2: {
        hits: 0,
        misses: 0,
        sets: 0,
        connected: false,
      },
      performance: {
        avgGetTime: 0,
        avgSetTime: 0,
        totalOperations: 0,
      },
    };

    this.startStatsMonitoring();
  }

  private startStatsMonitoring(): void {
    setInterval(() => {
      this.updateStats();
    }, 10000); // Update stats every 10 seconds
  }

  private updateStats(): void {
    this.stats.l1.size = this.l1Cache.size;
    this.stats.l2.connected = this.l2Cache.isConnected();
  }

  private buildKey(key: string, namespace?: string): string {
    const ns = namespace || this.namespace;
    return `${ns}:${key}`;
  }

  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const start = performance.now();
    const cacheKey = this.buildKey(key, options.namespace);

    try {
      // Try L1 cache first (memory)
      if (!options.skipMemory) {
        const l1Result = this.l1Cache.get(cacheKey);
        if (l1Result !== undefined) {
          this.stats.l1.hits++;
          this.recordPerformance('get', performance.now() - start);
          return l1Result as T;
        } else {
          this.stats.l1.misses++;
        }
      }

      // Try L2 cache (Redis) if L1 miss
      if (!options.skipRedis && this.l2Cache.isConnected()) {
        const l2Result = await this.l2Cache.get<T>(cacheKey);
        if (l2Result !== null) {
          this.stats.l2.hits++;
          
          // Populate L1 cache with the result
          if (!options.skipMemory) {
            this.l1Cache.set(cacheKey, l2Result);
            this.stats.l1.sets++;
          }
          
          this.recordPerformance('get', performance.now() - start);
          return l2Result;
        } else {
          this.stats.l2.misses++;
        }
      }

      this.recordPerformance('get', performance.now() - start);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.recordPerformance('get', performance.now() - start);
      return null;
    }
  }

  async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const start = performance.now();
    const cacheKey = this.buildKey(key, options.namespace);
    let success = true;

    try {
      // Set in L1 cache (memory)
      if (!options.skipMemory) {
        if (options.ttl) {
          this.l1Cache.set(cacheKey, value, { ttl: options.ttl * 1000 });
        } else {
          this.l1Cache.set(cacheKey, value);
        }
        this.stats.l1.sets++;
      }

      // Set in L2 cache (Redis)
      if (!options.skipRedis && this.l2Cache.isConnected()) {
        const redisSuccess = await this.l2Cache.set(cacheKey, value, options.ttl);
        if (redisSuccess) {
          this.stats.l2.sets++;
        } else {
          success = false;
        }
      }

      this.recordPerformance('set', performance.now() - start);
      return success;
    } catch (error) {
      console.error('Cache set error:', error);
      this.recordPerformance('set', performance.now() - start);
      return false;
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.buildKey(key, options.namespace);
    let success = true;

    try {
      // Delete from L1 cache
      if (!options.skipMemory) {
        this.l1Cache.delete(cacheKey);
      }

      // Delete from L2 cache
      if (!options.skipRedis && this.l2Cache.isConnected()) {
        const redisDeleted = await this.l2Cache.del(cacheKey);
        success = redisDeleted > 0;
      }

      return success;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async clear(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        // Clear specific namespace
        const pattern = this.buildKey('*', namespace);
        
        // Clear L1 cache entries matching pattern
        for (const key of this.l1Cache.keys()) {
          if (key.startsWith(this.buildKey('', namespace))) {
            this.l1Cache.delete(key);
          }
        }
        
        // Clear L2 cache entries matching pattern
        if (this.l2Cache.isConnected()) {
          await this.l2Cache.flushPattern(pattern);
        }
      } else {
        // Clear all caches
        this.l1Cache.clear();
        if (this.l2Cache.isConnected()) {
          const pattern = this.buildKey('*');
          await this.l2Cache.flushPattern(pattern);
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.buildKey(key, options.namespace);

    // Check L1 cache first
    if (!options.skipMemory && this.l1Cache.has(cacheKey)) {
      return true;
    }

    // Check L2 cache
    if (!options.skipRedis && this.l2Cache.isConnected()) {
      return await this.l2Cache.exists(cacheKey);
    }

    return false;
  }

  async mget<T = any>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    const cacheKeys = keys.map(key => this.buildKey(key, options.namespace));
    const results: (T | null)[] = new Array(keys.length).fill(null);
    const missingIndices: number[] = [];

    // Try L1 cache first
    if (!options.skipMemory) {
      for (let i = 0; i < cacheKeys.length; i++) {
        const value = this.l1Cache.get(cacheKeys[i]);
        if (value !== undefined) {
          results[i] = value as T;
          this.stats.l1.hits++;
        } else {
          missingIndices.push(i);
          this.stats.l1.misses++;
        }
      }
    } else {
      missingIndices.push(...Array.from({ length: keys.length }, (_, i) => i));
    }

    // Try L2 cache for missing items
    if (missingIndices.length > 0 && !options.skipRedis && this.l2Cache.isConnected()) {
      const missingKeys = missingIndices.map(i => cacheKeys[i]);
      const redisResults = await this.l2Cache.mget<T>(missingKeys);

      for (let j = 0; j < missingIndices.length; j++) {
        const originalIndex = missingIndices[j];
        const value = redisResults[j];
        
        if (value !== null) {
          results[originalIndex] = value;
          this.stats.l2.hits++;
          
          // Populate L1 cache
          if (!options.skipMemory) {
            this.l1Cache.set(cacheKeys[originalIndex], value);
            this.stats.l1.sets++;
          }
        } else {
          this.stats.l2.misses++;
        }
      }
    }

    return results;
  }

  async mset(keyValuePairs: Record<string, any>, options: CacheOptions = {}): Promise<boolean> {
    const cacheKeyPairs: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(keyValuePairs)) {
      const cacheKey = this.buildKey(key, options.namespace);
      cacheKeyPairs[cacheKey] = value;
      
      // Set in L1 cache
      if (!options.skipMemory) {
        if (options.ttl) {
          this.l1Cache.set(cacheKey, value, { ttl: options.ttl * 1000 });
        } else {
          this.l1Cache.set(cacheKey, value);
        }
        this.stats.l1.sets++;
      }
    }

    // Set in L2 cache
    if (!options.skipRedis && this.l2Cache.isConnected()) {
      const success = await this.l2Cache.mset(cacheKeyPairs, options.ttl);
      if (success) {
        this.stats.l2.sets += Object.keys(cacheKeyPairs).length;
      }
      return success;
    }

    return true;
  }

  async invalidate(pattern: CacheInvalidationPattern, options: CacheOptions = {}): Promise<number> {
    let invalidated = 0;

    try {
      if (typeof pattern === 'string') {
        // String pattern (can include wildcards)
        const cachePattern = this.buildKey(pattern, options.namespace);
        
        // Invalidate L1 cache
        if (!options.skipMemory) {
          const regex = new RegExp(cachePattern.replace(/\*/g, '.*'));
          for (const key of this.l1Cache.keys()) {
            if (regex.test(key)) {
              this.l1Cache.delete(key);
              invalidated++;
            }
          }
        }
        
        // Invalidate L2 cache
        if (!options.skipRedis && this.l2Cache.isConnected()) {
          const deletedCount = await this.l2Cache.flushPattern(cachePattern);
          invalidated += deletedCount;
        }
      } else if (pattern instanceof RegExp) {
        // RegExp pattern
        if (!options.skipMemory) {
          for (const key of this.l1Cache.keys()) {
            if (pattern.test(key)) {
              this.l1Cache.delete(key);
              invalidated++;
            }
          }
        }
        
        // For Redis, convert RegExp to string pattern (approximate)
        if (!options.skipRedis && this.l2Cache.isConnected()) {
          const allKeys = await this.l2Cache.keys(this.buildKey('*', options.namespace));
          const keysToDelete = allKeys.filter(key => pattern.test(key));
          if (keysToDelete.length > 0) {
            const deletedCount = await this.l2Cache.del(keysToDelete);
            invalidated += deletedCount;
          }
        }
      } else if (typeof pattern === 'function') {
        // Function pattern
        const keysToDelete: string[] = [];
        
        if (!options.skipMemory) {
          for (const [key, value] of this.l1Cache.entries()) {
            if (pattern(key, value)) {
              this.l1Cache.delete(key);
              keysToDelete.push(key);
              invalidated++;
            }
          }
        }
        
        // For Redis, we need to get all keys and values first (expensive operation)
        if (!options.skipRedis && this.l2Cache.isConnected()) {
          const allKeys = await this.l2Cache.keys(this.buildKey('*', options.namespace));
          const keysToDeleteRedis: string[] = [];
          
          for (const key of allKeys) {
            const value = await this.l2Cache.get(key);
            if (value !== null && pattern(key, value)) {
              keysToDeleteRedis.push(key);
            }
          }
          
          if (keysToDeleteRedis.length > 0) {
            const deletedCount = await this.l2Cache.del(keysToDeleteRedis);
            invalidated += deletedCount;
          }
        }
      }

      console.log(`Invalidated ${invalidated} cache entries matching pattern`);
      return invalidated;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  // Cache-aside pattern helpers
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch the data
    const value = await fetcher();
    
    // Store in cache for next time
    await this.set(key, value, options);
    
    return value;
  }

  // Write-through cache pattern
  async setThrough<T>(
    key: string,
    value: T,
    writer: (value: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<void> {
    // Write to storage first
    await writer(value);
    
    // Then update cache
    await this.set(key, value, options);
  }

  // Write-behind (write-back) cache pattern
  async setBehind<T>(
    key: string,
    value: T,
    writer: (value: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<void> {
    // Update cache immediately
    await this.set(key, value, options);
    
    // Schedule background write to storage
    setImmediate(async () => {
      try {
        await writer(value);
      } catch (error) {
        console.error('Write-behind cache error:', error);
        // Optionally invalidate cache on write failure
        await this.del(key, options);
      }
    });
  }

  private recordPerformance(operation: 'get' | 'set', duration: number): void {
    this.stats.performance.totalOperations++;
    
    if (operation === 'get') {
      this.stats.performance.avgGetTime = (
        (this.stats.performance.avgGetTime * (this.stats.performance.totalOperations - 1)) + duration
      ) / this.stats.performance.totalOperations;
    } else {
      this.stats.performance.avgSetTime = (
        (this.stats.performance.avgSetTime * (this.stats.performance.totalOperations - 1)) + duration
      ) / this.stats.performance.totalOperations;
    }
  }

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      l1: {
        hits: 0,
        misses: 0,
        sets: 0,
        size: this.l1Cache.size,
        maxSize: this.stats.l1.maxSize,
      },
      l2: {
        hits: 0,
        misses: 0,
        sets: 0,
        connected: this.l2Cache.isConnected(),
      },
      performance: {
        avgGetTime: 0,
        avgSetTime: 0,
        totalOperations: 0,
      },
    };
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    l1: { healthy: boolean; size: number };
    l2: { healthy: boolean; connected: boolean };
  }> {
    const l1Healthy = this.l1Cache !== undefined;
    const l2Connected = this.l2Cache.isConnected();
    
    return {
      healthy: l1Healthy && (l2Connected || process.env.NODE_ENV === 'development'),
      l1: {
        healthy: l1Healthy,
        size: this.l1Cache.size,
      },
      l2: {
        healthy: l2Connected,
        connected: l2Connected,
      },
    };
  }

  // Cleanup resources
  async close(): Promise<void> {
    this.l1Cache.clear();
    await this.l2Cache.disconnect();
  }
}

// Global cache instance
let globalCache: MultiLayerCache | undefined;

export function getCache(options?: {
  memoryMaxSize?: number;
  memoryTtl?: number;
  redisConfig?: any;
  namespace?: string;
}): MultiLayerCache {
  if (!globalCache) {
    globalCache = new MultiLayerCache(options);
  }
  return globalCache;
}

// Cache decorators for methods
export function cached(options: CacheOptions & { 
  keyGenerator?: (...args: any[]) => string;
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache = getCache();
      const key = options.keyGenerator 
        ? options.keyGenerator(...args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      return await cache.getOrSet(key, async () => {
        return await method.apply(this, args);
      }, options);
    };
    
    return descriptor;
  };
}

export { CacheOptions, CacheStats };