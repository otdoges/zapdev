/**
 * Agent and sandbox configuration constants.
 * 
 * Centralizes magic numbers to make the codebase more maintainable.
 */

// ============================================================================
// SANDBOX CONFIGURATION
// ============================================================================

/** Maximum sandbox execution time (30 minutes) */
export const SANDBOX_TIMEOUT = 30 * 60 * 1000;

/** Maximum number of retries when creating a sandbox */
export const SANDBOX_CREATE_RETRIES = 3;

/** Timeout for sandbox kill operation (5 seconds) */
export const SANDBOX_KILL_TIMEOUT = 5000;

/** Background cleanup retry delay after failed kill (10 seconds) */
export const SANDBOX_KILL_RETRY_DELAY = 10000;

/** Sandbox cache entry expiration time (5 minutes) */
export const SANDBOX_CACHE_EXPIRY = 5 * 60 * 1000;

/** Maximum number of cached sandbox connections (LRU eviction) */
export const SANDBOX_CACHE_MAX_SIZE = 50;

/** Sandbox health check timeout (5 seconds) */
export const SANDBOX_HEALTH_CHECK_TIMEOUT = 5000;

// ============================================================================
// CIRCUIT BREAKER CONFIGURATION
// ============================================================================

/** Number of failures before circuit opens */
export const CIRCUIT_BREAKER_THRESHOLD = 5;

/** Time to wait before attempting recovery (1 minute) */
export const CIRCUIT_BREAKER_TIMEOUT = 60000;

// ============================================================================
// AUTO-FIX CONFIGURATION
// ============================================================================

/** Maximum number of auto-fix retry attempts */
export const AUTO_FIX_MAX_ATTEMPTS = 2;

/** Maximum agent steps for auto-fix retry iterations */
export const AUTO_FIX_MAX_STEPS = 6;

// ============================================================================
// VALIDATION CONFIGURATION
// ============================================================================

/** Timeout for lint/build validation commands (2 minutes) */
export const VALIDATION_TIMEOUT = 120_000;

/** Terminal command execution timeout (2 minutes) */
export const TERMINAL_COMMAND_TIMEOUT = 120_000;

// ============================================================================
// MESSAGE STREAMING CONFIGURATION
// ============================================================================

/** Throttle interval for message stream updates (200ms) */
export const MESSAGE_STREAM_THROTTLE = 200;
