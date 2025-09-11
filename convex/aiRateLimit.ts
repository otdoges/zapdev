import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Production-grade AI rate limiting with multiple tiers and strategies
 */

export interface AIRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  burstAllowance?: number;
  costLimit?: number; // Dollar amount limit per window
}

// Rate limit tiers based on user subscription
export const AI_RATE_LIMITS: Record<string, AIRateLimitConfig> = {
  free: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    burstAllowance: 2,
    costLimit: 0.10, // $0.10 per minute
  },
  pro: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    burstAllowance: 10,
    costLimit: 1.00, // $1.00 per minute
  },
  enterprise: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    burstAllowance: 30,
    costLimit: 5.00, // $5.00 per minute
  },
};


// Store rate limit state
export const aiRateLimitState = mutation({
  args: {
    userId: v.string(),
    operation: v.string(),
    tokens: v.optional(v.number()),
    cost: v.optional(v.number()),
    tier: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { userId: string; operation: string; tokens?: number; cost?: number; tier?: string }) => {
    const now = Date.now();
    const key = `ai_rate_${args.userId}_${args.operation}`;
    const tier = args.tier || "free";
    const limits = AI_RATE_LIMITS[tier as keyof typeof AI_RATE_LIMITS] || AI_RATE_LIMITS.free;
    
    // Get current state or create new
    const state = await ctx.db
      .query("aiRateLimits")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();
    
    if (!state) {
      // Create new rate limit state
      await ctx.db.insert("aiRateLimits", {
        key,
        userId: args.userId,
        operation: args.operation,
        requestCount: 1,
        totalCost: args.cost || 0,
        windowStart: now,
        lastRequest: now,
        tokens: args.tokens || 0,
        createdAt: now,
        updatedAt: now,
      });
      return { allowed: true, remaining: limits.maxRequests - 1 };
    }
    
    // Check if window has expired
    if (now - state.windowStart > limits.windowMs) {
      // Reset window
      await ctx.db.patch(state._id, {
        requestCount: 1,
        totalCost: args.cost || 0,
        windowStart: now,
        lastRequest: now,
        tokens: args.tokens || 0,
      });
      return { allowed: true, remaining: limits.maxRequests - 1 };
    }
    
    // Update existing state
    await ctx.db.patch(state._id, {
      requestCount: state.requestCount + 1,
      totalCost: state.totalCost + (args.cost || 0),
      lastRequest: now,
      tokens: state.tokens + (args.tokens || 0),
    });
    
    return {
      allowed: true,
      remaining: limits.maxRequests - state.requestCount - 1,
    };
  },
});

// Check if AI request is allowed
export const checkAIRateLimit = query({
  args: {
    userId: v.string(),
    operation: v.string(),
    estimatedCost: v.optional(v.number()),
    tier: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { userId: string; operation: string; estimatedCost?: number; tier?: string }) => {
    const tier = args.tier || "free";
    const limits = AI_RATE_LIMITS[tier as keyof typeof AI_RATE_LIMITS] || AI_RATE_LIMITS.free;
    const now = Date.now();
    const key = `ai_rate_${args.userId}_${args.operation}`;
    
    // Get current rate limit state
    const state = await ctx.db
      .query("aiRateLimits")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();
    
    if (!state) {
      // No previous requests
      return {
        allowed: true,
        remaining: limits.maxRequests - 1,
        resetAt: now + limits.windowMs,
        costRemaining: limits.costLimit || Infinity,
      };
    }
    
    // Check if window has expired
    if (now - state.windowStart > limits.windowMs) {
      // Reset window
      return {
        allowed: true,
        remaining: limits.maxRequests - 1,
        resetAt: now + limits.windowMs,
        costRemaining: limits.costLimit || Infinity,
      };
    }
    
    // Check request count
    if (state.requestCount >= limits.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: state.windowStart + limits.windowMs,
        reason: "Request limit exceeded",
        costRemaining: limits.costLimit ? limits.costLimit - state.totalCost : Infinity,
      };
    }
    
    // Check cost limit
    if (limits.costLimit && args.estimatedCost) {
      const projectedCost = state.totalCost + args.estimatedCost;
      if (projectedCost > limits.costLimit) {
        return {
          allowed: false,
          remaining: limits.maxRequests - state.requestCount,
          resetAt: state.windowStart + limits.windowMs,
          reason: "Cost limit would be exceeded",
          costRemaining: limits.costLimit - state.totalCost,
        };
      }
    }
    
    // Request allowed
    return {
      allowed: true,
      remaining: limits.maxRequests - state.requestCount - 1,
      resetAt: state.windowStart + limits.windowMs,
      costRemaining: limits.costLimit ? limits.costLimit - state.totalCost : Infinity,
    };
  },
});

// Enforce AI rate limits with detailed tracking
export async function enforceAIRateLimit(
  ctx: MutationCtx,
  userId: string,
  operation: string,
  options?: {
    estimatedCost?: number;
    tier?: string;
    tokens?: number;
  }
): Promise<void> {
  const tier = options?.tier || "free";
  const limits = AI_RATE_LIMITS[tier as keyof typeof AI_RATE_LIMITS] || AI_RATE_LIMITS.free;
  const now = Date.now();
  const key = `ai_rate_${userId}_${operation}`;
  // Get or create rate limit state
  const state = await ctx.db
    .query("aiRateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (!state) {
    // First request - create state
    await ctx.db.insert("aiRateLimits", {
      key,
      userId,
      operation,
      requestCount: 1,
      totalCost: options?.estimatedCost || 0,
      windowStart: now,
      lastRequest: now,
      tokens: options?.tokens || 0,
      createdAt: now,
      updatedAt: now,
    });
    return; // First request is always allowed
  }
  
  // Check if window has expired
  if (now - state.windowStart > limits.windowMs) {
    // Reset window
    await ctx.db.patch(state._id, {
      requestCount: 1,
      totalCost: options?.estimatedCost || 0,
      windowStart: now,
      lastRequest: now,
      tokens: options?.tokens || 0,
    });
    return; // First request in new window is allowed
  }
  
  // Check request count
  if (state.requestCount >= limits.maxRequests) {
    const resetTime = new Date(state.windowStart + limits.windowMs);
    throw new Error(
      `AI rate limit exceeded for ${operation}. ` +
      `Limit: ${limits.maxRequests} requests per ${limits.windowMs / 1000}s. ` +
      `Reset at: ${resetTime.toISOString()}`
    );
  }
  
  // Check cost limit
  if (limits.costLimit && options?.estimatedCost) {
    const projectedCost = state.totalCost + options.estimatedCost;
    if (projectedCost > limits.costLimit) {
      throw new Error(
        `AI cost limit would be exceeded. ` +
        `Current: $${state.totalCost.toFixed(2)}, ` +
        `Requested: $${options.estimatedCost.toFixed(2)}, ` +
        `Limit: $${limits.costLimit.toFixed(2)} per ${limits.windowMs / 1000}s`
      );
    }
  }
  
  // Check burst allowance using token bucket
  if (limits.burstAllowance && state.requestCount > 0) {
    const timeSinceLastRequest = now - state.lastRequest;
    const minInterval = limits.windowMs / limits.maxRequests;
    
    if (timeSinceLastRequest < minInterval && state.requestCount > limits.burstAllowance) {
      throw new Error(
        `AI burst limit exceeded. Please wait ${Math.ceil(minInterval / 1000)}s between requests.`
      );
    }
  }
  
  // Update state - request is allowed
  await ctx.db.patch(state._id, {
    requestCount: state.requestCount + 1,
    totalCost: state.totalCost + (options?.estimatedCost || 0),
    lastRequest: now,
    tokens: state.tokens + (options?.tokens || 0),
  });
}

// Get user's current AI usage statistics
export const getAIUsageStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx: QueryCtx, args: { userId: string }) => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Get all AI rate limit records for user
    const records = await ctx.db
      .query("aiRateLimits")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    
    // Calculate statistics
    const hourlyStats = records.filter((r: any) => r.windowStart > oneHourAgo);
    const dailyStats = records.filter((r: any) => r.windowStart > oneDayAgo);
    
    const hourlyRequests = hourlyStats.reduce((sum: any, r: any) => sum + r.requestCount, 0);
    const hourlyTokens = hourlyStats.reduce((sum: any, r: any) => sum + r.tokens, 0);
    const hourlyCost = hourlyStats.reduce((sum: any, r: any) => sum + r.totalCost, 0);
    
    const dailyRequests = dailyStats.reduce((sum: any, r: any) => sum + r.requestCount, 0);
    const dailyTokens = dailyStats.reduce((sum: any, r: any) => sum + r.tokens, 0);
    const dailyCost = dailyStats.reduce((sum: any, r: any) => sum + r.totalCost, 0);
    
    return {
      hourly: {
        requests: hourlyRequests,
        tokens: hourlyTokens,
        cost: hourlyCost,
      },
      daily: {
        requests: dailyRequests,
        tokens: dailyTokens,
        cost: dailyCost,
      },
    };
  },
});

// Clean up old rate limit records
export const cleanupAIRateLimits = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000; // Keep 1 hour of history
    
    // Find old records
    const oldRecords = await ctx.db
      .query("aiRateLimits")
      .filter((q: any) => q.lt(q.field("windowStart"), oneHourAgo))
      .collect();
    
    // Delete old records
    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }
    
    return { deleted: oldRecords.length };
  },
});