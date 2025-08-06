import * as Sentry from '@sentry/react';

type SentryWithMetrics = typeof Sentry & {
  metrics?: {
    distribution: (name: string, value: number, options?: unknown) => void;
    increment: (name: string, value?: number, options?: unknown) => void;
  };
};

const SentryMetrics = Sentry as SentryWithMetrics;

/**
 * Production-grade AI utilities for error handling, retries, and monitoring
 */

const { logger } = Sentry;

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryableErrors: [
    'rate_limit_exceeded',
    'timeout',
    'network_error',
    'service_unavailable',
    '500',
    '502',
    '503',
    '504',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
  ]
};

/**
 * Determines if an error is retryable based on error message and type
 */
export function isRetryableError(error: unknown, config: RetryConfig): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  return config.retryableErrors?.some(retryableError => 
    errorMessage.includes(retryableError.toLowerCase())
  ) || false;
}

/**
 * Calculate exponential backoff delay with jitter
 */
export function calculateBackoffDelay(
  attempt: number, 
  config: RetryConfig
): number {
  const exponentialDelay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
  const clampedDelay = Math.min(exponentialDelay, config.maxDelay);
  
  // Add jitter (±25% randomization)
  const jitter = clampedDelay * 0.25 * (Math.random() * 2 - 1);
  
  return Math.round(clampedDelay + jitter);
}

/**
 * Retry wrapper with exponential backoff for AI operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      logger.info(`${operationName}: Attempt ${attempt}/${config.maxRetries}`);
      
      const result = await operation();
      
      if (attempt > 1) {
        logger.info(`${operationName}: Succeeded after ${attempt} attempts`);
        Sentry.captureMessage(`AI operation recovered after retry`, {
          level: 'info',
          extra: {
            operation: operationName,
            attempts: attempt,
          }
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      logger.error(`${operationName}: Attempt ${attempt} failed`, {
        error: error instanceof Error ? error.message : String(error),
        attempt,
        maxRetries: config.maxRetries
      });
      
      if (attempt === config.maxRetries || !isRetryableError(error, config)) {
        // Final attempt failed or non-retryable error
        Sentry.captureException(error, {
          tags: {
            ai_operation: operationName,
            retry_attempts: attempt,
            final_failure: true
          },
          extra: {
            config,
            errorType: error instanceof Error ? error.constructor.name : typeof error
          }
        });
        break;
      }
      
      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt, config);
      logger.info(`${operationName}: Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted
  throw lastError;
}

/**
 * Enhanced error types for AI operations
 */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIRateLimitError extends AIError {
  constructor(
    message: string = 'AI rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
  }
}

export class AIQuotaExceededError extends AIError {
  constructor(
    message: string = 'AI quota exceeded',
    public readonly quotaResetAt?: Date
  ) {
    super(message, 'QUOTA_EXCEEDED', false, { quotaResetAt });
  }
}

export class AIInvalidKeyError extends AIError {
  constructor(message: string = 'Invalid AI API key') {
    super(message, 'INVALID_API_KEY', false);
  }
}

export class AITimeoutError extends AIError {
  constructor(
    message: string = 'AI request timed out',
    public readonly timeoutMs?: number
  ) {
    super(message, 'TIMEOUT', true, { timeoutMs });
  }
}

/**
 * Parse AI provider errors into structured error types
 */
export function parseAIError(error: unknown): AIError {
  if (error instanceof AIError) {
    return error;
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorLower = errorMessage.toLowerCase();
  
  // Rate limit errors
  if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
    return new AIRateLimitError(errorMessage);
  }
  
  // Quota errors
  if (errorLower.includes('quota') || errorLower.includes('limit exceeded')) {
    return new AIQuotaExceededError(errorMessage);
  }
  
  // Invalid key errors
  if (errorLower.includes('invalid key') || errorLower.includes('unauthorized') || errorLower.includes('401')) {
    return new AIInvalidKeyError(errorMessage);
  }
  
  // Timeout errors
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return new AITimeoutError(errorMessage);
  }
  
  // Generic retryable errors
  if (errorLower.includes('500') || errorLower.includes('502') || errorLower.includes('503') || errorLower.includes('504')) {
    return new AIError(errorMessage, 'SERVER_ERROR', true);
  }
  
  // Default to non-retryable error
  return new AIError(errorMessage, 'UNKNOWN', false);
}

/**
 * Monitor AI operation performance
 */
export async function monitorAIOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    // Log successful operation
    logger.info(`AI operation completed: ${operationName}`, {
      duration,
      ...metadata
    });
    // Send metrics to monitoring
    if (SentryMetrics.metrics?.distribution) {
      SentryMetrics.metrics.distribution(`ai.operation.duration`, duration, {
        tags: {
          operation: operationName,
          status: 'success'
        }
      });
    }
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const parsedError = parseAIError(error);
    
    // Log failed operation
    logger.error(`AI operation failed: ${operationName}`, {
      duration,
      error: parsedError.message,
      code: parsedError.code,
      isRetryable: parsedError.isRetryable,
      ...metadata
    });
    
    // Send metrics to monitoring
    SentryMetrics.metrics.distribution(`ai.operation.duration`, duration, {
      tags: {
        operation: operationName,
        status: 'error',
        error_code: parsedError.code
      }
    });
    
    SentryMetrics.metrics.increment(`ai.operation.errors`, 1, {
      tags: {
        operation: operationName,
        error_code: parsedError.code,
        retryable: String(parsedError.isRetryable)
      }
    });
    
    throw parsedError;
  }
}

/**
 * Circuit breaker for AI operations
 */
export class AICircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private halfOpenAttempts = 0;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeout: number = 60000, // 1 minute
    private readonly halfOpenRequests: number = 3
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'open' && Date.now() - this.lastFailureTime > this.resetTimeout) {
      this.state = 'half-open';
      this.failures = 0;
      this.halfOpenAttempts = 0;
    }

    // Circuit is open - fail fast
    if (this.state === 'open') {
      throw new AIError(
        `Circuit breaker is open for ${operationName}`,
        'CIRCUIT_BREAKER_OPEN',
        true
      );
    }

    // In half-open state, check if we've exceeded test requests
    if (this.state === 'half-open' && this.halfOpenAttempts >= this.halfOpenRequests) {
      // Too many attempts without enough successes, re-open circuit
      this.state = 'open';
      throw new AIError(
        `Circuit breaker is open for ${operationName}`,
        'CIRCUIT_BREAKER_OPEN',
        true
      );
    }

    // Count this attempt in half-open
    if (this.state === 'half-open') {
      this.halfOpenAttempts++;
    }

    try {
      const result = await operation();

      // Success - if enough half-open attempts have succeeded, close the circuit
      if (this.state === 'half-open') {
        if (this.halfOpenAttempts >= this.halfOpenRequests) {
          this.state = 'closed';
          this.failures = 0;
          this.halfOpenAttempts = 0;
        }
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      // In half-open state, any failure should re-open immediately
      if (this.state === 'half-open') {
        this.state = 'open';
        logger.warn(`Circuit breaker re-opened for ${operationName} after failure in half-open state`);
      }

      // Trip the circuit if threshold exceeded (for normal closed state failures)
      if (this.failures >= this.failureThreshold) {
        this.state = 'open';
        logger.warn(`Circuit breaker opened for ${operationName} after ${this.failures} failures`);

        Sentry.captureMessage('AI Circuit Breaker Opened', {
          level: 'warning',
          tags: {
            operation: operationName
          },
          extra: {
            failures: this.failures,
            threshold: this.failureThreshold
          }
        });
      }

      throw error;
    }
  }
}

/**
 * Response cache for AI operations
 */
export class AIResponseCache {
  private cache = new Map<string, { response: unknown; timestamp: number }>();
  
  constructor(
    private readonly ttl: number = 300000, // 5 minutes default
    private readonly maxSize: number = 100
  ) {}
  
  generateKey(prompt: string, metadata?: Record<string, unknown>): string {
    const data = { prompt, ...metadata };
    return btoa(JSON.stringify(data));
  }
  
  get(key: string): unknown | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    logger.info('AI response cache hit', { key });
    SentryMetrics.metrics.increment('ai.cache.hits', 1);
    
    return cached.response;
  }
  
  set(key: string, response: unknown): void {
    // Enforce max cache size
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
    
    SentryMetrics.metrics.increment('ai.cache.sets', 1);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}