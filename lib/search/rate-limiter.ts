/**
 * Search Rate Limiter
 * 
 * Implements rate limiting for search requests based on user subscription tiers
 * and prevents abuse of the search API.
 */

import { auth } from '@clerk/nextjs/server';
import { SearchSubscriptionManager, SubscriptionTier } from './subscription-limits';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  current: number;
  reason?: string;
}

// Default rate limits by subscription tier
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    maxRequests: 50,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    subscriptionTier: 'free'
  },
  pro: {
    maxRequests: 500,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    subscriptionTier: 'pro'
  },
  enterprise: {
    maxRequests: 10000,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    subscriptionTier: 'enterprise'
  }
};

// In-memory store for rate limiting (in production, use Redis or database)
class RateLimitStore {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  get(userId: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const key = userId;
    const existing = this.requests.get(key);

    if (!existing || now > existing.resetTime) {
      // Reset window
      const newEntry = {
        count: 0,
        resetTime: now + windowMs
      };
      this.requests.set(key, newEntry);
      return newEntry;
    }

    return existing;
  }

  increment(userId: string): void {
    const key = userId;
    const existing = this.requests.get(key);
    if (existing) {
      existing.count++;
      this.requests.set(key, existing);
    }
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const store = new RateLimitStore();

// Cleanup expired entries every hour
setInterval(() => store.cleanup(), 60 * 60 * 1000);

export class SearchRateLimiter {
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      ...DEFAULT_LIMITS.free,
      ...config
    };
  }

  /**
   * Check if a user is allowed to make a search request
   */
  async checkRateLimit(userId: string, subscriptionTier: string = 'free'): Promise<RateLimitResult> {
    const limits = DEFAULT_LIMITS[subscriptionTier] || DEFAULT_LIMITS.free;
    const { count, resetTime } = store.get(userId, limits.windowMs);

    if (count >= limits.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(resetTime),
        current: count,
        reason: `Rate limit exceeded. ${subscriptionTier} tier allows ${limits.maxRequests} searches per day.`
      };
    }

    return {
      allowed: true,
      remaining: limits.maxRequests - count,
      resetTime: new Date(resetTime),
      current: count
    };
  }

  /**
   * Consume a rate limit slot (call after successful search)
   */
  async consumeRateLimit(userId: string): Promise<void> {
    store.increment(userId);
  }

  /**
   * Get current usage statistics for a user
   */
  async getUsageStats(userId: string, subscriptionTier: string = 'free'): Promise<{
    used: number;
    limit: number;
    remaining: number;
    resetTime: Date;
    subscriptionTier: string;
  }> {
    const limits = DEFAULT_LIMITS[subscriptionTier] || DEFAULT_LIMITS.free;
    const { count, resetTime } = store.get(userId, limits.windowMs);

    return {
      used: count,
      limit: limits.maxRequests,
      remaining: Math.max(0, limits.maxRequests - count),
      resetTime: new Date(resetTime),
      subscriptionTier
    };
  }

  /**
   * Check if user has enough quota for batch operations
   */
  async checkBatchQuota(userId: string, batchSize: number, subscriptionTier: string = 'free'): Promise<RateLimitResult> {
    const limits = DEFAULT_LIMITS[subscriptionTier] || DEFAULT_LIMITS.free;
    const { count, resetTime } = store.get(userId, limits.windowMs);

    if (count + batchSize > limits.maxRequests) {
      return {
        allowed: false,
        remaining: Math.max(0, limits.maxRequests - count),
        resetTime: new Date(resetTime),
        current: count,
        reason: `Batch operation would exceed rate limit. Need ${batchSize} searches, have ${limits.maxRequests - count} remaining.`
      };
    }

    return {
      allowed: true,
      remaining: limits.maxRequests - count - batchSize,
      resetTime: new Date(resetTime),
      current: count
    };
  }
}

// Convenience function to check rate limit with auth and subscription integration
export async function checkSearchRateLimit(searchType: 'standard' | 'deep' | 'batch' = 'standard'): Promise<RateLimitResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        current: 0,
        reason: 'Authentication required'
      };
    }

    // Check subscription limits first
    const subscriptionCheck = await SearchSubscriptionManager.canPerformSearch(userId, searchType);
    if (!subscriptionCheck.allowed) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        current: 0,
        reason: subscriptionCheck.reason || 'Subscription limit exceeded'
      };
    }

    // Get user's subscription tier and quota
    const quota = await SearchSubscriptionManager.getUserQuota(userId);
    const usage = await SearchSubscriptionManager.getUserUsage(userId);
    
    const limiter = new SearchRateLimiter();
    const rateLimitResult = await limiter.checkRateLimit(userId, quota.tier);
    
    // Override rate limit with subscription limits
    const remaining = Math.min(
      rateLimitResult.remaining,
      quota.dailyLimit - usage.dailyUsage
    );
    
    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: rateLimitResult.resetTime,
        current: usage.dailyUsage,
        reason: `Daily search limit reached (${quota.dailyLimit} per day). ${quota.tier === 'free' ? 'Upgrade to Pro for higher limits.' : ''}`
      };
    }
    
    return {
      allowed: true,
      remaining,
      resetTime: rateLimitResult.resetTime,
      current: usage.dailyUsage
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(),
      current: 0,
      reason: 'Rate limit check failed'
    };
  }
}

// Convenience function to consume rate limit with auth and subscription tracking
export async function consumeSearchRateLimit(searchType: 'standard' | 'deep' | 'batch' = 'standard'): Promise<void> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Authentication required');
    }

    const limiter = new SearchRateLimiter();
    await limiter.consumeRateLimit(userId);
    
    // Record usage in subscription system
    await SearchSubscriptionManager.recordSearchUsage(userId, searchType);
  } catch (error) {
    console.error('Rate limit consumption error:', error);
    throw error;
  }
}

// Get usage statistics for current user
export async function getSearchUsageStats(): Promise<{
  used: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  subscriptionTier: string;
} | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    // TODO: Get user's subscription tier from database
    const subscriptionTier = 'free';
    
    const limiter = new SearchRateLimiter();
    return limiter.getUsageStats(userId, subscriptionTier);
  } catch (error) {
    console.error('Usage stats error:', error);
    return null;
  }
}