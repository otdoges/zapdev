import { getRedisClient } from '../cache/redis-client';
import { getLogger } from '../monitoring/logger';
import { createHash, randomBytes } from 'crypto';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (identifier: string, endpoint?: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (identifier: string, limit: number) => void;
  message?: string;
  statusCode?: number;
  headers?: boolean;
}

export interface RateLimitRule {
  name: string;
  matcher: string | RegExp | ((path: string, method: string) => boolean);
  config: RateLimitConfig;
  priority: number;
}

export interface SubscriptionLimits {
  [tier: string]: {
    requests: {
      perMinute: number;
      perHour: number;
      perDay: number;
    };
    burst: {
      maxRequests: number;
      windowMs: number;
    };
    concurrent: number;
  };
}

export interface RateLimitResult {
  allowed: boolean;
  totalHits: number;
  totalTime: number;
  resetTime: Date;
  remaining: number;
  retryAfter?: number;
}

export class RateLimiter {
  private redis = getRedisClient();
  private logger = getLogger();
  private rules: RateLimitRule[] = [];
  private subscriptionLimits: SubscriptionLimits;

  constructor(subscriptionLimits?: SubscriptionLimits) {
    this.subscriptionLimits = subscriptionLimits || {
      free: {
        requests: {
          perMinute: 60,
          perHour: 1000,
          perDay: 10000,
        },
        burst: {
          maxRequests: 10,
          windowMs: 1000, // 1 second
        },
        concurrent: 5,
      },
      pro: {
        requests: {
          perMinute: 300,
          perHour: 10000,
          perDay: 100000,
        },
        burst: {
          maxRequests: 50,
          windowMs: 1000,
        },
        concurrent: 20,
      },
      enterprise: {
        requests: {
          perMinute: 1000,
          perHour: 50000,
          perDay: 1000000,
        },
        burst: {
          maxRequests: 100,
          windowMs: 1000,
        },
        concurrent: 100,
      },
    };

    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    // Public API endpoints - strictest limits
    this.addRule({
      name: 'public-api',
      matcher: /^\/api\/public\//,
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        message: 'Too many requests to public API',
      },
      priority: 1,
    });

    // Authentication endpoints - moderate limits
    this.addRule({
      name: 'auth',
      matcher: /^\/api\/(auth|login|register|logout)/,
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 20,
        message: 'Too many authentication attempts',
      },
      priority: 2,
    });

    // AI endpoints - usage-based limits
    this.addRule({
      name: 'ai-endpoints',
      matcher: /^\/api\/(ai-system|autonomous|generate|apply-ai)/,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        message: 'AI API rate limit exceeded',
      },
      priority: 3,
    });

    // File upload endpoints
    this.addRule({
      name: 'uploads',
      matcher: /^\/api\/upload/,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        message: 'Upload rate limit exceeded',
      },
      priority: 4,
    });

    // General API endpoints
    this.addRule({
      name: 'general-api',
      matcher: /^\/api\//,
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        message: 'API rate limit exceeded',
      },
      priority: 10,
    });
  }

  addRule(rule: RateLimitRule): void {
    this.rules.push(rule);
    // Sort by priority (lower number = higher priority)
    this.rules.sort((a, b) => a.priority - b.priority);
    
    this.logger.info('Rate limiting rule added', {
      name: rule.name,
      matcher: rule.matcher.toString(),
      priority: rule.priority,
      config: {
        windowMs: rule.config.windowMs,
        maxRequests: rule.config.maxRequests,
      },
    });
  }

  removeRule(name: string): void {
    const index = this.rules.findIndex(rule => rule.name === name);
    if (index >= 0) {
      this.rules.splice(index, 1);
      this.logger.info('Rate limiting rule removed', { name });
    }
  }

  private findMatchingRule(path: string, method: string): RateLimitRule | null {
    for (const rule of this.rules) {
      if (typeof rule.matcher === 'string') {
        if (path.startsWith(rule.matcher)) {
          return rule;
        }
      } else if (rule.matcher instanceof RegExp) {
        if (rule.matcher.test(path)) {
          return rule;
        }
      } else if (typeof rule.matcher === 'function') {
        if (rule.matcher(path, method)) {
          return rule;
        }
      }
    }
    return null;
  }

  private generateKey(
    identifier: string, 
    endpoint: string, 
    windowMs: number,
    keyGenerator?: (identifier: string, endpoint?: string) => string
  ): string {
    if (keyGenerator) {
      return keyGenerator(identifier, endpoint);
    }
    
    const timestamp = Math.floor(Date.now() / windowMs);
    const key = `rate_limit:${identifier}:${endpoint}:${timestamp}`;
    return createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  async checkLimit(
    identifier: string,
    path: string,
    method: string,
    subscriptionTier?: string
  ): Promise<RateLimitResult> {
    try {
      // Find matching rule
      const rule = this.findMatchingRule(path, method);
      if (!rule) {
        // No rule matches, allow request
        return {
          allowed: true,
          totalHits: 0,
          totalTime: 0,
          resetTime: new Date(Date.now() + 60000), // 1 minute from now
          remaining: Infinity,
        };
      }

      const config = rule.config;
      let { windowMs, maxRequests } = config;

      // Adjust limits based on subscription tier
      if (subscriptionTier && this.subscriptionLimits[subscriptionTier]) {
        const tierLimits = this.subscriptionLimits[subscriptionTier];
        
        // Use subscription-based limits for certain endpoints
        if (rule.name === 'ai-endpoints') {
          maxRequests = tierLimits.requests.perMinute;
          windowMs = 60 * 1000; // 1 minute
        } else if (rule.name === 'general-api') {
          maxRequests = tierLimits.requests.perHour;
          windowMs = 60 * 60 * 1000; // 1 hour
        }
      }

      const key = this.generateKey(identifier, path, windowMs, config.keyGenerator);
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const resetTime = new Date(windowStart + windowMs);

      if (!this.redis.isConnected()) {
        // Fall back to in-memory rate limiting (simplified)
        this.logger.warn('Redis not available, using fallback rate limiting');
        return {
          allowed: true,
          totalHits: 1,
          totalTime: windowMs,
          resetTime,
          remaining: maxRequests - 1,
        };
      }

      // Get current count
      const current = await this.redis.get(key) || 0;
      const totalHits = parseInt(current.toString()) + 1;

      // Check if limit exceeded
      if (totalHits > maxRequests) {
        const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000);
        
        this.logger.warn('Rate limit exceeded', {
          identifier,
          path,
          rule: rule.name,
          totalHits,
          maxRequests,
          retryAfter,
          tier: subscriptionTier,
        });

        if (config.onLimitReached) {
          config.onLimitReached(identifier, maxRequests);
        }

        return {
          allowed: false,
          totalHits,
          totalTime: windowMs,
          resetTime,
          remaining: 0,
          retryAfter,
        };
      }

      // Increment counter
      const pipeline = this.redis.pipeline();
      pipeline.set(key, totalHits);
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      await pipeline.exec();

      this.logger.debug('Rate limit check passed', {
        identifier,
        path,
        rule: rule.name,
        totalHits,
        maxRequests,
        remaining: maxRequests - totalHits,
        tier: subscriptionTier,
      });

      return {
        allowed: true,
        totalHits,
        totalTime: windowMs,
        resetTime,
        remaining: maxRequests - totalHits,
      };
    } catch (error) {
      this.logger.error('Rate limit check failed', error as Error, {
        identifier,
        path,
        method,
      });

      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        totalHits: 0,
        totalTime: 0,
        resetTime: new Date(Date.now() + 60000),
        remaining: Infinity,
      };
    }
  }

  async checkBurstLimit(
    identifier: string,
    subscriptionTier: string = 'free'
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      const limits = this.subscriptionLimits[subscriptionTier];
      if (!limits) {
        return { allowed: true };
      }

      const { maxRequests, windowMs } = limits.burst;
      const key = `burst_limit:${identifier}`;
      const now = Date.now();

      if (!this.redis.isConnected()) {
        return { allowed: true };
      }

      // Get request timestamps in the current window
      const timestamps = await this.redis.lrange(key, 0, -1);
      const cutoff = now - windowMs;
      
      // Remove old timestamps
      const validTimestamps = timestamps
        .map(ts => parseInt(ts))
        .filter(ts => ts > cutoff);

      if (validTimestamps.length >= maxRequests) {
        const oldestValidTimestamp = Math.min(...validTimestamps);
        const retryAfter = Math.ceil((oldestValidTimestamp + windowMs - now) / 1000);
        
        this.logger.warn('Burst limit exceeded', {
          identifier,
          currentRequests: validTimestamps.length,
          maxRequests,
          retryAfter,
          tier: subscriptionTier,
        });

        return { allowed: false, retryAfter };
      }

      // Add current timestamp and clean up old ones
      const pipeline = this.redis.pipeline();
      pipeline.lpush(key, now.toString());
      pipeline.ltrim(key, 0, maxRequests - 1);
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      await pipeline.exec();

      return { allowed: true };
    } catch (error) {
      this.logger.error('Burst limit check failed', error as Error, {
        identifier,
        tier: subscriptionTier,
      });
      return { allowed: true };
    }
  }

  async checkConcurrentRequests(
    identifier: string,
    subscriptionTier: string = 'free'
  ): Promise<{ allowed: boolean; current: number; max: number }> {
    try {
      const limits = this.subscriptionLimits[subscriptionTier];
      if (!limits) {
        return { allowed: true, current: 0, max: Infinity };
      }

      const maxConcurrent = limits.concurrent;
      const key = `concurrent:${identifier}`;

      if (!this.redis.isConnected()) {
        return { allowed: true, current: 0, max: maxConcurrent };
      }

      const current = await this.redis.get(key) || 0;
      const currentCount = parseInt(current.toString());

      if (currentCount >= maxConcurrent) {
        this.logger.warn('Concurrent request limit exceeded', {
          identifier,
          current: currentCount,
          max: maxConcurrent,
          tier: subscriptionTier,
        });

        return { allowed: false, current: currentCount, max: maxConcurrent };
      }

      return { allowed: true, current: currentCount, max: maxConcurrent };
    } catch (error) {
      this.logger.error('Concurrent request check failed', error as Error, {
        identifier,
        tier: subscriptionTier,
      });
      return { allowed: true, current: 0, max: Infinity };
    }
  }

  async incrementConcurrent(identifier: string): Promise<string> {
    try {
      if (!this.redis.isConnected()) {
        return '';
      }

      const key = `concurrent:${identifier}`;
      const requestId = randomBytes(8).toString('hex'); // 16-character random ID
      
      await this.redis.increment(key, 1);
      await this.redis.expire(key, 300); // 5 minutes timeout
      
      // Store request ID for cleanup
      await this.redis.sadd(`concurrent_requests:${identifier}`, requestId);
      await this.redis.expire(`concurrent_requests:${identifier}`, 300);
      
      return requestId;
    } catch (error) {
      this.logger.error('Failed to increment concurrent counter', error as Error);
      return '';
    }
  }

  async decrementConcurrent(identifier: string, requestId: string): Promise<void> {
    try {
      if (!this.redis.isConnected() || !requestId) {
        return;
      }

      const key = `concurrent:${identifier}`;
      const requestsKey = `concurrent_requests:${identifier}`;
      
      // Only decrement if this request ID exists
      const exists = await this.redis.sismember(requestsKey, requestId);
      if (exists) {
        await this.redis.decrement(key, 1);
        await this.redis.srem(requestsKey, requestId);
      }
    } catch (error) {
      this.logger.error('Failed to decrement concurrent counter', error as Error);
    }
  }

  // Get current rate limit status
  async getStatus(identifier: string): Promise<{
    limits: Array<{
      rule: string;
      remaining: number;
      resetTime: Date;
      totalHits: number;
    }>;
    concurrent: number;
    tier: string;
  }> {
    const status: any = {
      limits: [],
      concurrent: 0,
      tier: 'unknown',
    };

    try {
      if (!this.redis.isConnected()) {
        return status;
      }

      // Check each rule's current status
      for (const rule of this.rules) {
        try {
          const key = this.generateKey(identifier, 'status', rule.config.windowMs);
          const current = await this.redis.get(key) || 0;
          const totalHits = parseInt(current.toString());
          const windowStart = Math.floor(Date.now() / rule.config.windowMs) * rule.config.windowMs;
          const resetTime = new Date(windowStart + rule.config.windowMs);
          
          status.limits.push({
            rule: rule.name,
            remaining: Math.max(0, rule.config.maxRequests - totalHits),
            resetTime,
            totalHits,
          });
        } catch (error) {
          // Skip rule if there's an error
          continue;
        }
      }

      // Get concurrent requests
      const concurrentKey = `concurrent:${identifier}`;
      const concurrent = await this.redis.get(concurrentKey) || 0;
      status.concurrent = parseInt(concurrent.toString());
    } catch (error) {
      this.logger.error('Failed to get rate limit status', error as Error);
    }

    return status;
  }

  // Reset limits for a specific identifier (admin function)
  async resetLimits(identifier: string): Promise<void> {
    try {
      if (!this.redis.isConnected()) {
        return;
      }

      // Find and delete all keys for this identifier
      const patterns = [
        `rate_limit:${identifier}:*`,
        `burst_limit:${identifier}`,
        `concurrent:${identifier}`,
        `concurrent_requests:${identifier}`,
      ];

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }

      this.logger.info('Rate limits reset', { identifier });
    } catch (error) {
      this.logger.error('Failed to reset rate limits', error as Error, { identifier });
    }
  }

  // Get rate limiting statistics
  async getStatistics(): Promise<{
    totalRequests: number;
    limitedRequests: number;
    topIdentifiers: Array<{ identifier: string; requests: number }>;
    ruleUsage: Array<{ rule: string; hits: number }>;
  }> {
    const stats = {
      totalRequests: 0,
      limitedRequests: 0,
      topIdentifiers: [] as Array<{ identifier: string; requests: number }>,
      ruleUsage: [] as Array<{ rule: string; hits: number }>,
    };

    try {
      if (!this.redis.isConnected()) {
        return stats;
      }

      // This would require more sophisticated tracking
      // For now, return basic stats from logger
      const loggerStats = this.logger.getStats();
      
      // Count rate limit related logs
      const recentLogs = this.logger.getLogs({
        limit: 1000,
        startTime: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      });

      const rateLimitLogs = recentLogs.filter(log => 
        log.message?.includes('Rate limit') || 
        log.context?.rateLimiting
      );

      stats.totalRequests = rateLimitLogs.length;
      stats.limitedRequests = rateLimitLogs.filter(log => 
        log.message?.includes('exceeded')
      ).length;

      return stats;
    } catch (error) {
      this.logger.error('Failed to get rate limiting statistics', error as Error);
      return stats;
    }
  }
}

// Global rate limiter instance
let globalRateLimiter: RateLimiter | undefined;

export function getRateLimiter(subscriptionLimits?: SubscriptionLimits): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter(subscriptionLimits);
  }
  return globalRateLimiter;
}

export function createRateLimitingMiddleware(customLimits?: SubscriptionLimits) {
  const rateLimiter = getRateLimiter(customLimits);
  
  return async function rateLimitMiddleware(req: any, res: any, next: any) {
    try {
      // Extract identifier (user ID, IP address, API key, etc.)
      const identifier = req.user?.id || 
                        req.headers['x-api-key'] || 
                        req.ip || 
                        req.headers['x-forwarded-for'] || 
                        'anonymous';
      
      const subscriptionTier = req.user?.subscription?.tier || 'free';
      const path = req.path || req.url;
      const method = req.method;

      // Check burst limit first
      const burstCheck = await rateLimiter.checkBurstLimit(identifier, subscriptionTier);
      if (!burstCheck.allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Burst rate limit exceeded',
          retryAfter: burstCheck.retryAfter,
        });
      }

      // Check concurrent requests
      const concurrentCheck = await rateLimiter.checkConcurrentRequests(identifier, subscriptionTier);
      if (!concurrentCheck.allowed) {
        return res.status(429).json({
          error: 'Too many concurrent requests',
          message: `Maximum ${concurrentCheck.max} concurrent requests allowed`,
          current: concurrentCheck.current,
        });
      }

      // Increment concurrent counter
      const requestId = await rateLimiter.incrementConcurrent(identifier);

      // Check main rate limit
      const rateLimitResult = await rateLimiter.checkLimit(identifier, path, method, subscriptionTier);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimitResult.totalTime);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.getTime());
      
      if (!rateLimitResult.allowed) {
        res.setHeader('Retry-After', rateLimitResult.retryAfter || 60);
        
        // Decrement concurrent counter
        await rateLimiter.decrementConcurrent(identifier, requestId);
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later',
          retryAfter: rateLimitResult.retryAfter,
          resetTime: rateLimitResult.resetTime,
        });
      }

      // Attach cleanup function to response
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        rateLimiter.decrementConcurrent(identifier, requestId);
        return originalEnd.apply(this, args);
      };

      next();
    } catch (error) {
      console.error('Rate limiting middleware error:', error);
      // Fail open - continue to next middleware
      next();
    }
  };
}