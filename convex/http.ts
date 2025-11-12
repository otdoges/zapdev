import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

// Rate limiting configuration
const RATE_LIMITS = {
  auth: {
    limit: 10, // 10 requests
    windowMs: 60 * 1000, // per minute
  },
  general: {
    limit: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
  },
};

/**
 * Extract client IP from request headers
 */
function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in case of multiple
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default IP for localhost/development
  return "127.0.0.1";
}

/**
 * Rate limiting middleware
 */
async function rateLimitMiddleware(
  request: Request,
  ctx: any
): Promise<{ allowed: boolean; message?: string }> {
  const clientIP = getClientIP(request);
  const url = new URL(request.url);
  const isAuthEndpoint = url.pathname.startsWith("/auth");

  // Choose rate limit based on endpoint type
  const limitConfig = isAuthEndpoint ? RATE_LIMITS.auth : RATE_LIMITS.general;

  try {
    // Check rate limit using Convex mutation
    const result = await ctx.runMutation(api.rateLimit.checkRateLimit, {
      key: `ip_${clientIP}_${isAuthEndpoint ? "auth" : "general"}`,
      limit: limitConfig.limit,
      windowMs: limitConfig.windowMs,
    });

    return {
      allowed: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Allow request on rate limiting failure to avoid blocking legitimate users
    return { allowed: true };
  }
}

// Register Better Auth routes
// Note: Rate limiting is disabled as Better Auth handles its own routing
// Rate limiting would need to be implemented at the application level or
// within individual route handlers if needed
authComponent.registerRoutes(http, createAuth);

// Export the HTTP router
export default http;
