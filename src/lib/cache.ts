/**
 * Simple in-memory cache for static data
 * Prevents redundant computations and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 1000 * 60 * 5; // 5 minutes default

  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const maxAge = ttl ?? this.defaultTTL;

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get or compute and cache
   */
  async getOrCompute<T>(
    key: string,
    compute: () => T | Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key, ttl);
    if (cached !== null) return cached;

    const data = await compute();
    this.set(key, data);
    return data;
  }
}

export const cache = new SimpleCache();

/**
 * Memoize function with cache
 */
export function memoize<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  keyFn?: (...args: Args) => string
): (...args: Args) => Return {
  const fnCache = new Map<string, Return>();

  return (...args: Args): Return => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (fnCache.has(key)) {
      return fnCache.get(key)!;
    }

    const result = fn(...args);
    fnCache.set(key, result);
    return result;
  };
}
