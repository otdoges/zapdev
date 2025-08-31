import { Redis as UpstashRedis } from '@upstash/redis';
import { performance } from 'perf_hooks';

interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  lazyConnect?: boolean;
  keyPrefix?: string;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalTime: number;
  operations: number;
}

type UpstashPipeline = ReturnType<UpstashRedis['pipeline']>;

export class RedisCache {
  private client: UpstashRedis;
  private connected: boolean = false;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    totalTime: 0,
    operations: 0,
  };

  constructor(config: CacheConfig = {}) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Redis cache may be unavailable.');
    }

    this.client = new UpstashRedis({ url: url || '', token: token || '' });
    this.connected = !!url && !!token;
  }

  private setupEventHandlers(): void {}

  async connect(): Promise<void> {
    try {
      await this.client.ping();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Upstash Redis:', error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async executeWithMetrics<T>(
    operation: () => Promise<T>,
    operationType: keyof CacheMetrics
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      this.metrics[operationType]++;
      this.metrics.totalTime += duration;
      this.metrics.operations++;
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected()) {
      this.metrics.misses++;
      return null;
    }

    return this.executeWithMetrics(async () => {
      const result = await this.client.get<string | null>(key);
      if (result === null) {
        this.metrics.misses++;
        return null;
      }
      
      this.metrics.hits++;
      return JSON.parse(result as string) as T;
    }, 'hits');
  }

  async set(
    key: string, 
    value: any, 
    ttlSeconds?: number
  ): Promise<boolean> {
    if (!this.isConnected()) {
      this.metrics.errors++;
      return false;
    }

    return this.executeWithMetrics(async () => {
      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.set(key, serializedValue, { ex: ttlSeconds });
      } else {
        await this.client.set(key, serializedValue);
      }
      
      this.metrics.sets++;
      return true;
    }, 'sets');
  }

  async del(key: string | string[]): Promise<number> {
    if (!this.isConnected()) {
      this.metrics.errors++;
      return 0;
    }

    return this.executeWithMetrics(async () => {
      const deletedCount = Array.isArray(key)
        ? await this.client.del(...key)
        : await this.client.del(key);
      this.metrics.deletes++;
      return deletedCount;
    }, 'deletes');
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected()) {
      return -1;
    }

    return await this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected()) {
      return [];
    }

    let cursor: number | string = 0;
    const keys: string[] = [];
    do {
      const res = await this.client.scan(cursor as number, { match: pattern, count: 1000 }) as unknown as [number | string, string[]];
      const nextCursor = res[0];
      const batch = res[1];
      cursor = nextCursor;
      if (Array.isArray(batch)) keys.push(...batch);
    } while (cursor !== 0 && cursor !== '0');
    return keys;
  }

  async flushPattern(pattern: string): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    const keys = await this.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    
    return await this.del(keys);
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected() || keys.length === 0) {
      return keys.map(() => null);
    }

    const results = await this.client.mget(...keys);
    return results.map((result: string | null) => {
      if (result === null) {
        this.metrics.misses++;
        return null;
      }
      
      this.metrics.hits++;
      return JSON.parse(result) as T;
    });
  }

  async mset(keyValuePairs: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    const pipeline = this.client.pipeline();
    
    for (const [key, value] of Object.entries(keyValuePairs)) {
      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        pipeline.set(key, serializedValue, { ex: ttlSeconds });
      } else {
        pipeline.set(key, serializedValue);
      }
    }

    const results = await pipeline.exec();
    const successCount = Array.isArray(results) ? results.filter((r: any) => !r.error).length : 0;
    
    this.metrics.sets += successCount;
    return successCount === Object.keys(keyValuePairs).length;
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.isConnected()) {
      throw new Error('Redis not connected');
    }

    return await this.client.incrby(key, amount);
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    if (!this.isConnected()) {
      throw new Error('Redis not connected');
    }

    return await this.client.decrby(key, amount);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.isConnected()) {
      return null;
    }

    return await this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: any): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    const serializedValue = JSON.stringify(value);
    const result = await this.client.hset(key, { [field]: serializedValue });
    return typeof result === 'number' ? result === 1 : true;
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    if (!this.isConnected()) {
      return {};
    }

    const result = await this.client.hgetall<Record<string, string> | null>(key);
    const parsed: Record<string, any> = {};
    
    for (const [field, value] of Object.entries(result ?? {})) {
      try {
        parsed[field] = JSON.parse(value);
      } catch {
        parsed[field] = value; // Keep as string if not JSON
      }
    }
    
    return parsed;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    return await this.client.hdel(key, ...fields);
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    const serializedValues = values.map(v => JSON.stringify(v));
    return await this.client.lpush(key, ...serializedValues);
  }

  async rpush(key: string, ...values: any[]): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    const serializedValues = values.map(v => JSON.stringify(v));
    return await this.client.rpush(key, ...serializedValues);
  }

  async lpop<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected()) {
      return null;
    }

    const result = await this.client.lpop(key);
    return result ? JSON.parse(result) as T : null;
  }

  async rpop<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected()) {
      return null;
    }

    const result = await this.client.rpop(key);
    return result ? JSON.parse(result) as T : null;
  }

  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    if (!this.isConnected()) {
      return [];
    }

    const results = await this.client.lrange(key, start, stop);
    return results.map(result => JSON.parse(result) as T);
  }

  // Set operations
  async sadd(key: string, ...members: any[]): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    const serializedMembers = members.map(m => JSON.stringify(m));
    return await this.client.sadd(key, ...serializedMembers);
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    if (!this.isConnected()) {
      return [];
    }

    const results = await this.client.smembers(key);
    return results.map(result => JSON.parse(result) as T);
  }

  async sismember(key: string, member: any): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    const serializedMember = JSON.stringify(member);
    const result = await this.client.sismember(key, serializedMember);
    return result === 1;
  }

  async srem(key: string, ...members: any[]): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    const serializedMembers = members.map(m => JSON.stringify(m));
    return await this.client.srem(key, ...serializedMembers);
  }

  // Pub/Sub operations
  async publish(channel: string, message: any): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    const serializedMessage = JSON.stringify(message);
    return await this.client.publish(channel, serializedMessage);
  }

  subscribe(channel: string, callback: (message: any) => void): void {
    console.warn('Upstash Redis HTTP client does not support subscribe.');
  }

  unsubscribe(channel?: string): void {}

  // Monitoring and metrics
  getMetrics(): CacheMetrics & { hitRate: number; avgResponseTime: number } {
    const hitRate = this.metrics.operations > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 
      : 0;
    
    const avgResponseTime = this.metrics.operations > 0 
      ? this.metrics.totalTime / this.metrics.operations 
      : 0;

    return {
      ...this.metrics,
      hitRate: parseFloat(hitRate.toFixed(2)),
      avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
    };
  }

  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalTime: 0,
      operations: 0,
    };
  }

  async info(): Promise<string> {
    if (!this.isConnected()) {
      return 'Redis not connected';
    }

    try {
      const info = await this.client.info();
      return typeof info === 'string' ? info : JSON.stringify(info);
    } catch {
      return 'Upstash Redis';
    }
  }

  async memory(): Promise<any> {
    return null;
  }

  // Utility methods
  buildKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }

  async pipeline() {
    return this.client.pipeline();
  }

  getClient(): UpstashRedis {
    return this.client;
  }
}

// Global Redis instance
let globalRedis: RedisCache | undefined;

export function getRedisClient(config?: CacheConfig): RedisCache {
  if (!globalRedis) {
    globalRedis = new RedisCache(config);
  }
  return globalRedis;
}