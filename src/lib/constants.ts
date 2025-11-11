/**
 * Application-wide constants
 */

/**
 * Authentication UI timing constants (milliseconds)
 */
export const AUTH_TIMING = {
  // Delay before resetting form after modal close
  POPUP_RESET_DELAY: 200,
  // Delay before redirecting after successful auth
  SUCCESS_REDIRECT_DELAY: 800,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  // Auth endpoints: 10 requests per minute per IP
  AUTH_LIMIT: 10,
  AUTH_WINDOW: "1 m",

  // Sensitive endpoints: 3 requests per 5 minutes per IP
  SENSITIVE_LIMIT: 3,
  SENSITIVE_WINDOW: "5 m",
} as const;

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  // Session expiration time in seconds (7 days)
  EXPIRES_IN: 60 * 60 * 24 * 7,
  // Session update age in seconds (1 day)
  UPDATE_AGE: 60 * 60 * 24,
  // Cookie cache max age in seconds (5 minutes)
  CACHE_MAX_AGE: 5 * 60,
} as const;
