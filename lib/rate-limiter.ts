/**
 * Rate limiting middleware for API endpoints
 * Uses in-memory storage for development and Redis for production
 */

import { NextRequest, NextResponse } from 'next/server';
import { errorLogger, ErrorCategory } from './error-logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  identifier: (req: NextRequest) => string; // Function to extract identifier
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for development
class InMemoryStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return 1;
    }

    entry.count++;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry || entry.resetTime < Date.now()) {
      return null;
    }
    return entry;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Rate limiter instance
class RateLimiter {
  private store: InMemoryStore;

  constructor() {
    this.store = new InMemoryStore();
  }

  /**
   * Create rate limiting middleware
   */
  middleware(config: RateLimitConfig) {
    return async (req: NextRequest): Promise<NextResponse | null> => {
      try {
        const identifier = config.identifier(req);
        const key = `rate_limit:${identifier}`;

        // Check current rate limit status
        const entry = await this.store.get(key);
        const remaining = config.maxRequests - (entry?.count || 0);
        const resetTime = entry?.resetTime || Date.now() + config.windowMs;

        // Add rate limit headers
        const headers = new Headers({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        });

        // Check if rate limit exceeded
        if (entry && entry.count >= config.maxRequests) {
          errorLogger.warning(ErrorCategory.API, 'Rate limit exceeded', undefined, {
            identifier,
            limit: config.maxRequests,
            windowMs: config.windowMs,
          });

          return new NextResponse(
            JSON.stringify({
              error: config.message || 'Too many requests, please try again later.',
              retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
            }),
            {
              status: 429,
              headers: {
                ...Object.fromEntries(headers.entries()),
                'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
                'Content-Type': 'application/json',
              },
            }
          );
        }

        // Increment counter
        await this.store.increment(key, config.windowMs);

        // Return null to continue to the route handler
        return null;
      } catch (error) {
        errorLogger.error(ErrorCategory.API, 'Rate limiter error', error);
        // On error, allow the request to continue
        return null;
      }
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `rate_limit:${identifier}`;
    await this.store.reset(key);
  }

  /**
   * Get current rate limit status
   */
  async getStatus(identifier: string): Promise<RateLimitEntry | null> {
    const key = `rate_limit:${identifier}`;
    return await this.store.get(key);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Common rate limit configurations
export const RateLimitConfigs = {
  // Strict limit for AI endpoints
  AI_ENDPOINTS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // Increased from 10 to 30 requests per minute
    identifier: (req: NextRequest) => {
      // Use user ID from auth or IP address
      const userId = req.headers.get('x-user-id');
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      return userId || ip;
    },
    message: 'AI API rate limit exceeded. Please wait before making more requests.',
  },

  // Standard limit for general API endpoints
  GENERAL_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // Increased from 60 to 120 requests per minute
    identifier: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id');
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      return userId || ip;
    },
  },

  // Relaxed limit for read operations
  READ_OPERATIONS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    identifier: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id');
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      return userId || ip;
    },
  },

  // Very strict limit for authentication endpoints
  AUTH_ENDPOINTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    identifier: (req: NextRequest) => {
      // Always use IP for auth endpoints
      return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    },
    message: 'Too many authentication attempts. Please try again later.',
  },
};

// Helper function to apply rate limiting to API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = RateLimitConfigs.GENERAL_API
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimiter.middleware(config)(req);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(req);
  };
}

/**
 * Main rate limiting function for easy use in API routes
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RateLimitConfigs.AI_ENDPOINTS
): Promise<{ 
  success: boolean; 
  headers: Record<string, string>; 
  error?: string;
  remaining?: number;
  reset?: string;
}> {
  try {
    // Create a mock NextRequest for compatibility
    const mockReq = {
      headers: new Map([
        ['x-user-id', identifier],
        ['x-forwarded-for', identifier]
      ]),
    } as any;

    // Override identifier function to use our passed identifier
    const configWithIdentifier = {
      ...config,
      identifier: () => identifier
    };

    const response = await rateLimiter.middleware(configWithIdentifier)(mockReq);
    
    if (response) {
      // Rate limit exceeded
      const data = await response.json();
      return {
        success: false,
        headers: {
          'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit') || '0',
          'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining') || '0',
          'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset') || new Date().toISOString(),
          'Retry-After': response.headers.get('Retry-After') || '60'
        },
        error: data.error || 'Rate limit exceeded'
      };
    }

    // Rate limit check passed
    const status = await rateLimiter.getStatus(identifier);
    const remaining = config.maxRequests - (status?.count || 0);
    const resetTime = status?.resetTime || Date.now() + config.windowMs;

    return {
      success: true,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
      remaining: Math.max(0, remaining),
      reset: new Date(resetTime).toISOString()
    };
  } catch (error) {
    // On error, allow the request to continue
    return {
      success: true,
      headers: {},
      error: 'Rate limiter error - allowing request'
    };
  }
}

/**
 * Pre-configured rate limiter instance for chat API
 */
export const chatApiLimiter = {
  ...RateLimitConfigs.AI_ENDPOINTS,
  maxRequests: 30, // 30 requests per minute for chat
  windowMs: 60 * 1000, // 1 minute window
};
