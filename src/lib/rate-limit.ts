/**
 * Rate limiting utilities for auth endpoints
 * 
 * Protects against:
 * - Brute force password attacks
 * - Account enumeration
 * - DoS attacks via repeated auth requests
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_CONFIG } from "./constants";

// Initialize Redis client from environment variables
// Requires: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

// Create rate limiter for authentication endpoints
// 10 requests per minute per IP address
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMIT_CONFIG.AUTH_LIMIT, RATE_LIMIT_CONFIG.AUTH_WINDOW),
  analytics: true,
  prefix: "@zapdev/auth",
});

// Create stricter rate limiter for password reset/verification
// 3 requests per 5 minutes per IP address
export const sensitiveAuthRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMIT_CONFIG.SENSITIVE_LIMIT, RATE_LIMIT_CONFIG.SENSITIVE_WINDOW),
  analytics: true,
  prefix: "@zapdev/sensitive-auth",
});

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP if multiple are present
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  // Fallback to generic identifier
  return "unknown";
}

/**
 * Check rate limit and return appropriate response if exceeded
 */
export async function checkRateLimit(
  request: Request,
  limiter: Ratelimit = authRateLimit
): Promise<{ success: boolean; response?: Response; headers?: Record<string, string> }> {
  const ip = getClientIp(request);
  const { success, limit, reset, remaining } = await limiter.limit(ip);

  const rateLimitHeaders = {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": new Date(reset).toISOString(),
  };

  if (!success) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...rateLimitHeaders,
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      ),
    };
  }

  // Return rate limit headers for successful responses too
  return {
    success: true,
    headers: rateLimitHeaders,
  };
}
