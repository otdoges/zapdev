/**
 * Error Sanitization Utility
 * Sanitizes error objects and strings to prevent sensitive data leaks in logs
 */

import { sanitizeApiKeyForLogging } from '../lib/api-key-validator';

interface SanitizedError {
  message: string;
  code?: string;
  type?: string;
  status?: number;
  timestamp: string;
  sanitized: true;
}

// Patterns for sensitive data that should be redacted
const SENSITIVE_PATTERNS = [
  // API Keys and tokens
  { pattern: /sk-[A-Za-z0-9]{32,}/g, replacement: '[API_KEY_REDACTED]' },
  { pattern: /gsk_[A-Za-z0-9]+/g, replacement: '[API_KEY_REDACTED]' },
  { pattern: /AIza[A-Za-z0-9_-]+/g, replacement: '[API_KEY_REDACTED]' },
  { pattern: /ya29\.[A-Za-z0-9_-]+/g, replacement: '[ACCESS_TOKEN_REDACTED]' },
  { pattern: /Bearer\s+[A-Za-z0-9_-]+/gi, replacement: '[BEARER_TOKEN_REDACTED]' },
  { pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: '[JWT_TOKEN_REDACTED]' },
  
  // Email addresses (partial redaction)
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  
  // Phone numbers
  { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  { pattern: /\b\(\d{3}\)\s*\d{3}-\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  
  // Credit card patterns
  { pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: '[CARD_REDACTED]' },
  
  // SSN patterns
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  
  // Common secret patterns
  { pattern: /password\s*[:=]\s*\S+/gi, replacement: 'password=[REDACTED]' },
  { pattern: /secret\s*[:=]\s*\S+/gi, replacement: 'secret=[REDACTED]' },
  { pattern: /token\s*[:=]\s*\S+/gi, replacement: 'token=[REDACTED]' },
  { pattern: /key\s*[:=]\s*\S+/gi, replacement: 'key=[REDACTED]' },
  
  // IP addresses (optional - might be needed for debugging)
  // { pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, replacement: '[IP_REDACTED]' },
];

// Fields that should be excluded from error objects
const SENSITIVE_FIELDS = [
  'stack',
  'stackTrace',
  'headers',
  'requestBody',
  'responseBody',
  'body',
  'data',
  'config',
  'request',
  'response',
  'auth',
  'authorization',
  'cookie',
  'cookies',
  'session',
  'password',
  'secret',
  'token',
  'key',
  'apiKey',
  'accessToken',
  'refreshToken',
];

/**
 * Sanitizes a string by removing or masking sensitive patterns
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return String(input);
  }

  let sanitized = input;
  
  // Apply all sensitive pattern replacements
  SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });
  
  return sanitized;
}

/**
 * Sanitizes an error object by extracting safe fields and redacting sensitive data
 */
export function sanitizeError(error: unknown): SanitizedError {
  const timestamp = new Date().toISOString();
  
  // Handle null/undefined
  if (!error) {
    return {
      message: 'Unknown error occurred',
      timestamp,
      sanitized: true,
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: sanitizeString(error),
      timestamp,
      sanitized: true,
    };
  }
  
  // Handle Error objects and error-like objects
  if (typeof error === 'object') {
    const errorObj = error as Record<string, any>;
    const sanitized: SanitizedError = {
      message: 'An error occurred',
      timestamp,
      sanitized: true,
    };
    
    // Extract safe fields
    if (errorObj.message) {
      sanitized.message = sanitizeString(String(errorObj.message));
    } else if (errorObj.error) {
      sanitized.message = sanitizeString(String(errorObj.error));
    }
    
    if (errorObj.code) {
      sanitized.code = sanitizeString(String(errorObj.code));
    }
    
    if (errorObj.name || errorObj.type) {
      sanitized.type = sanitizeString(String(errorObj.name || errorObj.type));
    }
    
    if (errorObj.status || errorObj.statusCode) {
      const status = Number(errorObj.status || errorObj.statusCode);
      if (!isNaN(status)) {
        sanitized.status = status;
      }
    }
    
    return sanitized;
  }
  
  // Fallback for other types
  return {
    message: sanitizeString(String(error)),
    timestamp,
    sanitized: true,
  };
}

/**
 * Sanitizes an entire object by removing sensitive fields and sanitizing values
 */
export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return sanitizeString(String(obj));
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields entirely
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Creates a sanitized log message for errors
 */
export function createSanitizedErrorLog(message: string, error: unknown): {
  message: string;
  error: SanitizedError;
  context?: any;
} {
  return {
    message: sanitizeString(message),
    error: sanitizeError(error),
    context: {
      timestamp: new Date().toISOString(),
      sanitized: true,
    },
  };
}

/**
 * Utility for logging errors safely
 */
export function logSanitizedError(message: string, error: unknown, logger = console): void {
  const sanitizedLog = createSanitizedErrorLog(message, error);
  logger.error(sanitizedLog.message, sanitizedLog);
}
