import { QueryCtx, MutationCtx } from "./_generated/server";

// Rate limiting configuration
const RATE_LIMITS = {
  // User operations
  upsertUser: { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute
  updateUserPreferences: { windowMs: 60000, maxRequests: 20 }, // 20 requests per minute
  
  // Chat operations
  createChat: { windowMs: 60000, maxRequests: 50 }, // 50 chats per minute
  sendMessage: { windowMs: 60000, maxRequests: 100 }, // 100 messages per minute
  
  // Expensive operations
  deleteUserAccount: { windowMs: 3600000, maxRequests: 1 }, // 1 request per hour
  bulkOperations: { windowMs: 300000, maxRequests: 5 }, // 5 requests per 5 minutes
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// Rate limit storage - in production, consider using Redis
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a user has exceeded the rate limit for a specific operation
 */
export async function checkRateLimit(
  ctx: QueryCtx | MutationCtx,
  operation: RateLimitType
): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required for rate limiting");
  }

  const config = RATE_LIMITS[operation];
  const key = `${identity.subject}:${operation}`;
  const now = Date.now();
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    // First request or window has expired
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    
    return {
      allowed: true,
      resetTime,
      remaining: config.maxRequests - 1
    };
  }
  
  if (existing.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      resetTime: existing.resetTime,
      remaining: 0
    };
  }
  
  // Increment count
  existing.count++;
  rateLimitStore.set(key, existing);
  
  return {
    allowed: true,
    resetTime: existing.resetTime,
    remaining: config.maxRequests - existing.count
  };
}

/**
 * Enforce rate limit for a specific operation
 * Throws an error if rate limit is exceeded
 */
export async function enforceRateLimit(
  ctx: QueryCtx | MutationCtx,
  operation: RateLimitType
): Promise<void> {
  const result = await checkRateLimit(ctx, operation);
  
  if (!result.allowed) {
    const resetIn = Math.ceil((result.resetTime! - Date.now()) / 1000);
    throw new Error(
      `Rate limit exceeded for ${operation}. Try again in ${resetIn} seconds.`
    );
  }
}

/**
 * Clean up expired rate limit entries (should be called periodically)
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);

/**
 * Get current rate limit status for a user and operation
 */
export async function getRateLimitStatus(
  ctx: QueryCtx | MutationCtx,
  operation: RateLimitType
): Promise<{
  limit: number;
  remaining: number;
  resetTime: number;
  windowMs: number;
}> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  const config = RATE_LIMITS[operation];
  const key = `${identity.subject}:${operation}`;
  const now = Date.now();
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      windowMs: config.windowMs
    };
  }
  
  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - existing.count),
    resetTime: existing.resetTime,
    windowMs: config.windowMs
  };
}