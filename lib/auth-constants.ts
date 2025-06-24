/**
 * Authentication constants for consistent usage across the application
 * This file centralizes all authentication-related configuration values
 */

/**
 * Supabase authentication cookie names
 * These are the standard cookie names used by Supabase Auth
 */
export const AUTH_COOKIES = {
  /** Primary access token cookie used by Supabase Auth */
  ACCESS_TOKEN: 'sb-access-token',
  /** Refresh token cookie used by Supabase Auth */
  REFRESH_TOKEN: 'sb-refresh-token',
  /** Legacy auth token cookie (for backward compatibility) */
  LEGACY_AUTH_TOKEN: 'supabase-auth-token',
  /** Session cookie prefix used by Supabase */
  SESSION_PREFIX: 'sb-',
} as const;

/**
 * Authentication timeouts and delays
 */
export const AUTH_TIMEOUTS = {
  /** Time to wait for auth to settle after OAuth callback (milliseconds) */
  OAUTH_SETTLE_DELAY: 2000,
  /** Session check timeout */
  SESSION_CHECK_TIMEOUT: 5000,
  /** Token refresh interval */
  TOKEN_REFRESH_INTERVAL: 3600000, // 1 hour
} as const;

/**
 * Authentication routes and redirects
 */
export const AUTH_ROUTES = {
  /** Login/authentication page */
  AUTH: '/auth',
  /** Default redirect after successful auth */
  DEFAULT_REDIRECT: '/chat',
  /** OAuth callback route */
  CALLBACK: '/auth/callback',
  /** Password reset route */
  PASSWORD_RESET: '/auth/reset-password',
} as const;

/**
 * Security settings for authentication
 */
export const AUTH_SECURITY = {
  /** Whether to use secure cookies in production */
  SECURE_COOKIES: process.env.NODE_ENV === 'production',
  /** SameSite setting for auth cookies */
  SAME_SITE: 'lax' as const,
  /** HttpOnly setting for sensitive cookies */
  HTTP_ONLY: true,
  /** Cookie path */
  COOKIE_PATH: '/',
} as const;

/**
 * Helper function to check if a cookie name is an auth-related cookie
 * @param cookieName - The name of the cookie to check
 * @returns boolean indicating if it's an auth cookie
 */
export function isAuthCookie(cookieName: string): boolean {
  return Object.values(AUTH_COOKIES).some(authCookie => 
    cookieName.includes(authCookie) || cookieName.startsWith(AUTH_COOKIES.SESSION_PREFIX)
  );
}

/**
 * Helper function to get all auth cookie names as an array
 * @returns Array of all auth cookie names
 */
export function getAuthCookieNames(): readonly string[] {
  return Object.values(AUTH_COOKIES);
}

/**
 * Type-safe access to auth cookie names
 */
export type AuthCookieName = typeof AUTH_COOKIES[keyof typeof AUTH_COOKIES];

/**
 * Helper function to safely check for auth cookies in document.cookie
 * @param cookieString - The document.cookie string or undefined
 * @returns boolean indicating if auth cookies are present
 */
export function hasAuthCookies(cookieString?: string): boolean {
  if (!cookieString) return false;
  
  return getAuthCookieNames().some(cookieName => 
    cookieString.includes(cookieName)
  );
} 