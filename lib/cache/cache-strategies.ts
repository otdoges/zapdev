import { getCache, MultiLayerCache, CacheOptions } from './multi-layer-cache';
import { withDatabase, withDrizzle } from '../database/connection-enhanced';
import { schema } from '../database/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

interface CacheWarmupConfig {
  enabled: boolean;
  strategies: string[];
  batchSize: number;
  delayBetweenBatches: number;
  maxWarmupTime: number;
}

interface CacheInvalidationConfig {
  patterns: {
    [key: string]: {
      triggers: string[];
      dependencies: string[];
      cascading: boolean;
    };
  };
}

interface CacheTag {
  tag: string;
  keys: Set<string>;
  dependencies: Set<string>;
}

export class CacheManager {
  private cache: MultiLayerCache;
  private tags: Map<string, CacheTag> = new Map();
  private warmupConfig: CacheWarmupConfig;
  private invalidationConfig: CacheInvalidationConfig;

  constructor(options?: {
    cacheConfig?: any;
    warmupConfig?: Partial<CacheWarmupConfig>;
    invalidationConfig?: Partial<CacheInvalidationConfig>;
  }) {
    this.cache = getCache(options?.cacheConfig);
    
    this.warmupConfig = {
      enabled: process.env.CACHE_WARMUP_ENABLED !== 'false',
      strategies: ['popular_content', 'user_preferences', 'recent_data'],
      batchSize: 50,
      delayBetweenBatches: 100,
      maxWarmupTime: 30000, // 30 seconds
      ...options?.warmupConfig,
    };

    this.invalidationConfig = {
      patterns: {
        'user': {
          triggers: ['user:update', 'user:delete'],
          dependencies: ['user:profile', 'user:preferences', 'user:permissions'],
          cascading: true,
        },
        'post': {
          triggers: ['post:create', 'post:update', 'post:delete'],
          dependencies: ['post:list', 'post:category', 'post:author'],
          cascading: true,
        },
        'product': {
          triggers: ['product:update', 'product:delete', 'inventory:update'],
          dependencies: ['product:list', 'product:category', 'product:search'],
          cascading: true,
        },
        'order': {
          triggers: ['order:create', 'order:update', 'order:status'],
          dependencies: ['order:user', 'order:summary', 'analytics:sales'],
          cascading: false,
        },
      },
      ...options?.invalidationConfig,
    };
  }

  // Tagged caching system
  async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    options: CacheOptions = {}
  ): Promise<boolean> {
    // Store the value in cache
    const success = await this.cache.set(key, value, options);
    
    if (success) {
      // Associate key with tags
      for (const tagName of tags) {
        if (!this.tags.has(tagName)) {
          this.tags.set(tagName, {
            tag: tagName,
            keys: new Set(),
            dependencies: new Set(),
          });
        }
        
        const tag = this.tags.get(tagName)!;
        tag.keys.add(key);
      }
    }
    
    return success;
  }

  async invalidateByTag(tagName: string, options: CacheOptions = {}): Promise<number> {
    const tag = this.tags.get(tagName);
    if (!tag) {
      return 0;
    }

    let totalInvalidated = 0;

    // Invalidate all keys associated with this tag
    for (const key of tag.keys) {
      const success = await this.cache.del(key, options);
      if (success) {
        totalInvalidated++;
      }
    }

    // Handle cascading invalidation
    const config = this.invalidationConfig.patterns[tagName];
    if (config?.cascading && config.dependencies) {
      for (const depTag of config.dependencies) {
        const depInvalidated = await this.invalidateByTag(depTag, options);
        totalInvalidated += depInvalidated;
      }
    }

    // Clear the tag
    tag.keys.clear();
    
    console.log(`Invalidated ${totalInvalidated} cache entries for tag: ${tagName}`);
    return totalInvalidated;
  }

  // Smart invalidation based on data changes
  async handleDataChange(entity: string, operation: string, data: any): Promise<void> {
    const trigger = `${entity}:${operation}`;
    
    for (const [patternName, config] of Object.entries(this.invalidationConfig.patterns)) {
      if (config.triggers.includes(trigger)) {
        console.log(`Data change detected: ${trigger}, invalidating pattern: ${patternName}`);
        await this.invalidateByTag(patternName);
      }
    }

    // Specific invalidation logic based on entity and operation
    switch (entity) {
      case 'user':
        await this.invalidateUserCache(data.id, operation);
        break;
      case 'post':
        await this.invalidatePostCache(data, operation);
        break;
      case 'product':
        await this.invalidateProductCache(data, operation);
        break;
      case 'order':
        await this.invalidateOrderCache(data, operation);
        break;
    }
  }

  private async invalidateUserCache(userId: string, operation: string): Promise<void> {
    const patterns = [
      `user:${userId}:*`,
      `user:profile:${userId}`,
      `user:preferences:${userId}`,
      `user:permissions:${userId}`,
    ];

    if (operation === 'delete') {
      patterns.push(`user:list:*`);
    }

    for (const pattern of patterns) {
      await this.cache.invalidate(pattern);
    }
  }

  private async invalidatePostCache(data: any, operation: string): Promise<void> {
    const patterns = [
      `post:${data.id}:*`,
      `post:list:*`,
      `post:category:${data.category}:*`,
    ];

    if (data.authorId) {
      patterns.push(`post:author:${data.authorId}:*`);
    }

    for (const pattern of patterns) {
      await this.cache.invalidate(pattern);
    }
  }

  private async invalidateProductCache(data: any, operation: string): Promise<void> {
    const patterns = [
      `product:${data.id}:*`,
      `product:list:*`,
      `product:search:*`,
    ];

    if (data.category) {
      patterns.push(`product:category:${data.category}:*`);
    }

    for (const pattern of patterns) {
      await this.cache.invalidate(pattern);
    }
  }

  private async invalidateOrderCache(data: any, operation: string): Promise<void> {
    const patterns = [
      `order:${data.id}:*`,
      `order:user:${data.userId}:*`,
      `analytics:sales:*`,
    ];

    for (const pattern of patterns) {
      await this.cache.invalidate(pattern);
    }
  }

  // Cache warming strategies
  async warmupCache(): Promise<{ success: boolean; warmedKeys: number; duration: number }> {
    if (!this.warmupConfig.enabled) {
      return { success: true, warmedKeys: 0, duration: 0 };
    }

    const startTime = Date.now();
    let warmedKeys = 0;

    console.log('🔥 Starting cache warmup...');

    try {
      for (const strategy of this.warmupConfig.strategies) {
        const strategyWarmed = await this.executeWarmupStrategy(strategy);
        warmedKeys += strategyWarmed;

        // Check if we've exceeded max warmup time
        if (Date.now() - startTime > this.warmupConfig.maxWarmupTime) {
          console.log(`⏱️ Warmup timeout reached, stopping after ${strategy}`);
          break;
        }

        // Delay between strategies to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, this.warmupConfig.delayBetweenBatches));
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Cache warmup completed: ${warmedKeys} keys in ${duration}ms`);
      
      return { success: true, warmedKeys, duration };
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
      return { success: false, warmedKeys, duration: Date.now() - startTime };
    }
  }

  private async executeWarmupStrategy(strategy: string): Promise<number> {
    switch (strategy) {
      case 'popular_content':
        return await this.warmupPopularContent();
      case 'user_preferences':
        return await this.warmupUserPreferences();
      case 'recent_data':
        return await this.warmupRecentData();
      case 'product_catalog':
        return await this.warmupProductCatalog();
      default:
        console.warn(`Unknown warmup strategy: ${strategy}`);
        return 0;
    }
  }

  private async warmupPopularContent(): Promise<number> {
    let warmedKeys = 0;

    try {
      // Warm up popular posts
      await withDrizzle(async (drizzle) => {
        const popularPosts = await drizzle
          .select()
          .from(schema.posts)
          .where(eq(schema.posts.status, 'published'))
          .orderBy(desc(schema.posts.viewCount))
          .limit(this.warmupConfig.batchSize);

        for (const post of popularPosts) {
          const cacheKey = `post:${post.id}`;
          await this.cache.set(cacheKey, post, { ttl: 3600 }); // Cache for 1 hour
          warmedKeys++;
        }
      });

      console.log(`🔥 Warmed up ${warmedKeys} popular posts`);
    } catch (error) {
      console.error('Error warming up popular content:', error);
    }

    return warmedKeys;
  }

  private async warmupUserPreferences(): Promise<number> {
    let warmedKeys = 0;

    try {
      // Warm up active user data
      await withDrizzle(async (drizzle) => {
        const activeUsers = await drizzle
          .select()
          .from(schema.users)
          .where(eq(schema.users.isActive, true))
          .orderBy(desc(schema.users.createdAt))
          .limit(this.warmupConfig.batchSize);

        for (const user of activeUsers) {
          const profileKey = `user:profile:${user.id}`;
          const preferencesKey = `user:preferences:${user.id}`;
          
          await this.cache.mset({
            [profileKey]: {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              role: user.role,
            },
            [preferencesKey]: {
              // Default preferences or fetch from preferences table
              theme: 'dark',
              language: 'en',
              notifications: true,
            },
          }, { ttl: 1800 }); // Cache for 30 minutes

          warmedKeys += 2;
        }
      });

      console.log(`🔥 Warmed up ${warmedKeys} user preference entries`);
    } catch (error) {
      console.error('Error warming up user preferences:', error);
    }

    return warmedKeys;
  }

  private async warmupRecentData(): Promise<number> {
    let warmedKeys = 0;

    try {
      // Warm up recent analytics events
      await withDrizzle(async (drizzle) => {
        const recentEvents = await drizzle
          .select()
          .from(schema.analyticsEvents)
          .orderBy(desc(schema.analyticsEvents.createdAt))
          .limit(this.warmupConfig.batchSize);

        // Group events by type for caching
        const eventGroups: { [key: string]: any[] } = {};
        
        for (const event of recentEvents) {
          if (!eventGroups[event.eventName]) {
            eventGroups[event.eventName] = [];
          }
          eventGroups[event.eventName].push(event);
        }

        for (const [eventName, events] of Object.entries(eventGroups)) {
          const cacheKey = `analytics:recent:${eventName}`;
          await this.cache.set(cacheKey, events, { ttl: 600 }); // Cache for 10 minutes
          warmedKeys++;
        }
      });

      console.log(`🔥 Warmed up ${warmedKeys} recent data entries`);
    } catch (error) {
      console.error('Error warming up recent data:', error);
    }

    return warmedKeys;
  }

  private async warmupProductCatalog(): Promise<number> {
    let warmedKeys = 0;

    try {
      // Warm up active products by category
      await withDrizzle(async (drizzle) => {
        const activeProducts = await drizzle
          .select()
          .from(schema.products)
          .where(eq(schema.products.isActive, true))
          .orderBy(asc(schema.products.category), desc(schema.products.createdAt))
          .limit(this.warmupConfig.batchSize);

        // Group products by category
        const productsByCategory: { [key: string]: any[] } = {};
        
        for (const product of activeProducts) {
          if (!productsByCategory[product.category || 'uncategorized']) {
            productsByCategory[product.category || 'uncategorized'] = [];
          }
          productsByCategory[product.category || 'uncategorized'].push(product);
        }

        for (const [category, products] of Object.entries(productsByCategory)) {
          const categoryKey = `product:category:${category}`;
          await this.cache.set(categoryKey, products, { ttl: 1800 }); // Cache for 30 minutes
          warmedKeys++;

          // Also cache individual products
          for (const product of products) {
            const productKey = `product:${product.id}`;
            await this.cache.set(productKey, product, { ttl: 3600 }); // Cache for 1 hour
            warmedKeys++;
          }
        }
      });

      console.log(`🔥 Warmed up ${warmedKeys} product catalog entries`);
    } catch (error) {
      console.error('Error warming up product catalog:', error);
    }

    return warmedKeys;
  }

  // Cache performance optimization
  async optimizeCache(): Promise<{
    analyzed: number;
    optimized: number;
    suggestions: string[];
  }> {
    const stats = this.cache.getStats();
    const suggestions: string[] = [];
    let optimized = 0;

    // Analyze cache performance
    if (stats.l1.hits + stats.l1.misses > 0) {
      const l1HitRate = (stats.l1.hits / (stats.l1.hits + stats.l1.misses)) * 100;
      
      if (l1HitRate < 70) {
        suggestions.push('L1 cache hit rate is low, consider increasing memory cache size or adjusting TTL');
      }
      
      if (stats.l1.size >= stats.l1.maxSize * 0.9) {
        suggestions.push('L1 cache is near capacity, consider increasing max size');
      }
    }

    if (stats.l2.hits + stats.l2.misses > 0) {
      const l2HitRate = (stats.l2.hits / (stats.l2.hits + stats.l2.misses)) * 100;
      
      if (l2HitRate < 50) {
        suggestions.push('L2 cache hit rate is low, consider adjusting caching strategy or warming up more data');
      }
    }

    if (stats.performance.avgGetTime > 50) {
      suggestions.push('Average get time is high, consider optimizing cache infrastructure');
    }

    if (stats.performance.avgSetTime > 100) {
      suggestions.push('Average set time is high, consider optimizing write operations');
    }

    // Implement automatic optimizations
    if (suggestions.length === 0) {
      optimized++;
    }

    return {
      analyzed: 1,
      optimized,
      suggestions,
    };
  }

  // Utility methods
  getCache(): MultiLayerCache {
    return this.cache;
  }

  async healthCheck() {
    return await this.cache.healthCheck();
  }

  getStats() {
    return this.cache.getStats();
  }

  async close() {
    await this.cache.close();
  }
}

// Global cache manager instance
let globalCacheManager: CacheManager | undefined;

export function getCacheManager(options?: any): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager(options);
  }
  return globalCacheManager;
}

// Middleware for automatic cache invalidation
export function createCacheInvalidationMiddleware() {
  const cacheManager = getCacheManager();
  
  return {
    onUserUpdate: (userId: string, data: any) => cacheManager.handleDataChange('user', 'update', { id: userId, ...data }),
    onUserDelete: (userId: string) => cacheManager.handleDataChange('user', 'delete', { id: userId }),
    onPostCreate: (post: any) => cacheManager.handleDataChange('post', 'create', post),
    onPostUpdate: (post: any) => cacheManager.handleDataChange('post', 'update', post),
    onPostDelete: (postId: string) => cacheManager.handleDataChange('post', 'delete', { id: postId }),
    onProductUpdate: (product: any) => cacheManager.handleDataChange('product', 'update', product),
    onOrderCreate: (order: any) => cacheManager.handleDataChange('order', 'create', order),
  };
}