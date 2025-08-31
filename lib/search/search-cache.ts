/**
 * Search Result Cache
 * 
 * Implements intelligent caching for search results to reduce API costs
 * and improve response times for repeated searches.
 */

import { SearchResponse, SearchOptions } from './search-service';

export interface CacheEntry {
  result: SearchResponse;
  timestamp: number;
  expiresAt: number;
  queryHash: string;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  ttlMs?: number; // Time to live in milliseconds
  maxEntries?: number; // Maximum cache entries
  enableCompression?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  memoryUsage: number;
}

// Default cache configuration
const DEFAULT_CONFIG: Required<CacheOptions> = {
  ttlMs: 60 * 60 * 1000, // 1 hour default TTL
  maxEntries: 10000,
  enableCompression: false
};

// Different TTL based on search type
const TTL_CONFIG = {
  web: 60 * 60 * 1000,        // 1 hour for web searches
  news: 15 * 60 * 1000,       // 15 minutes for news
  recent: 5 * 60 * 1000,      // 5 minutes for recent searches
  code: 24 * 60 * 60 * 1000   // 24 hours for code/documentation
};

export class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    memoryUsage: 0
  };
  private config: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    
    // Setup periodic cleanup
    setInterval(() => this.cleanup(), 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Generate a cache key for the search query and options
   */
  private generateCacheKey(query: string, options: SearchOptions = {}): string {
    const normalizedQuery = query.trim().toLowerCase();
    const keyData = {
      query: normalizedQuery,
      count: options.count || 10,
      language: options.language || 'en',
      country: options.country || 'US',
      searchType: options.searchType || 'web',
      freshness: options.freshness
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Get TTL based on search type and options
   */
  private getTTL(options: SearchOptions = {}): number {
    if (options.freshness === 'day') return 15 * 60 * 1000; // 15 minutes for daily fresh
    if (options.freshness === 'week') return 60 * 60 * 1000; // 1 hour for weekly fresh
    
    switch (options.searchType) {
      case 'news':
        return TTL_CONFIG.news;
      default:
        // Check if query looks like code/documentation search
        const query = (options as any).query?.toLowerCase() || '';
        if (query.includes('documentation') || query.includes('api') || query.includes('tutorial')) {
          return TTL_CONFIG.code;
        }
        return TTL_CONFIG.web;
    }
  }

  /**
   * Get cached search results if available and not expired
   */
  get(query: string, options: SearchOptions = {}): SearchResponse | null {
    const key = this.generateCacheKey(query, options);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateStats();
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.stats.hits++;
    this.updateStats();
    
    return entry.result;
  }

  /**
   * Store search results in cache
   */
  set(query: string, result: SearchResponse, options: SearchOptions = {}): void {
    const key = this.generateCacheKey(query, options);
    const now = Date.now();
    const ttl = this.getTTL(options);
    
    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }
    
    const entry: CacheEntry = {
      result,
      timestamp: now,
      expiresAt: now + ttl,
      queryHash: key,
      accessCount: 1,
      lastAccessed: now
    };
    
    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * Check if a query result is cached and valid
   */
  has(query: string, options: SearchOptions = {}): boolean {
    const key = this.generateCacheKey(query, options);
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      memoryUsage: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;
    
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Search cache: cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;
    
    // Estimate memory usage (rough calculation)
    this.stats.memoryUsage = this.cache.size * 2048; // ~2KB per entry estimate
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern, 'i');
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache) {
      const queryData = JSON.parse(Buffer.from(entry.queryHash, 'base64').toString());
      if (regex.test(queryData.query)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Get popular search queries from cache
   */
  getPopularQueries(limit: number = 10): Array<{ query: string; count: number; lastAccessed: Date }> {
    const queries = Array.from(this.cache.values())
      .map(entry => {
        const queryData = JSON.parse(Buffer.from(entry.queryHash, 'base64').toString());
        return {
          query: queryData.query,
          count: entry.accessCount,
          lastAccessed: new Date(entry.lastAccessed)
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return queries;
  }
}

// Global cache instance
let cacheInstance: SearchCache | null = null;

export function getSearchCache(): SearchCache {
  if (!cacheInstance) {
    cacheInstance = new SearchCache({
      ttlMs: 60 * 60 * 1000, // 1 hour default
      maxEntries: 5000,
      enableCompression: false
    });
  }
  return cacheInstance;
}

/**
 * Utility function for cached search operations
 */
export async function cachedSearch<T>(
  key: string,
  searchFn: () => Promise<T>,
  options: SearchOptions = {}
): Promise<T> {
  const cache = getSearchCache();
  
  // Try to get from cache first
  const cached = cache.get(key, options);
  if (cached) {
    return cached as T;
  }
  
  // Not in cache, perform the search
  const result = await searchFn();
  
  // Store in cache
  if (result) {
    cache.set(key, result as SearchResponse, options);
  }
  
  return result;
}