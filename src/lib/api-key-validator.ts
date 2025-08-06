import * as Sentry from '@sentry/react';

/**
 * Production API Key Security Validator
 * Ensures API keys are never exposed in client bundles
 */

const { logger } = Sentry;

// Patterns that indicate potential API key exposure
const API_KEY_PATTERNS = [
  /sk[-_]?live[-_]?[a-zA-Z0-9]{20,}/i, // Stripe-like secret keys
  /pk[-_]?live[-_]?[a-zA-Z0-9]{20,}/i, // Public keys (less critical but still monitor)
  /api[-_]?key[-_]?[a-zA-Z0-9]{20,}/i, // Generic API keys
  /bearer\s+[a-zA-Z0-9_~+/.=-]+/i, // Bearer tokens
  /gsk[-_]?[a-zA-Z0-9]{20,}/i, // Groq keys
  /e2b[-_]?[a-zA-Z0-9]{20,}/i, // E2B keys
  /sk[-_]?or[-_]?[a-zA-Z0-9]{20,}/i, // OpenRouter keys
];

// Environment variable prefixes that should only contain public keys
const PUBLIC_KEY_PREFIXES = ['VITE_', 'NEXT_PUBLIC_', 'PUBLIC_'];

/**
 * Validates that a string doesn't contain exposed API keys
 */
export function validateNoExposedKeys(
  content: string,
  context: string = 'unknown'
): { safe: boolean; violations: string[] } {
  const violations: string[] = [];
  
  for (const pattern of API_KEY_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push(`Potential API key found in ${context}: ${matches[0].substring(0, 10)}...`);
      
      // Log security violation to monitoring
      logger.error('API Key Security Violation', {
        context,
        pattern: pattern.source,
        preview: matches[0].substring(0, 10) + '...'
      });
      
      Sentry.captureMessage('Potential API Key Exposure Detected', {
        level: 'error',
        tags: {
          security_type: 'api_key_exposure',
          context
        },
        extra: {
          pattern: pattern.source,
          location: context
        }
      });
    }
  }
  
  return {
    safe: violations.length === 0,
    violations
  };
}

/**
 * Validates environment variable safety
 */
export function validateEnvironmentVariables(): {
  safe: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check all environment variables
  const env = import.meta.env;
  
  for (const [key, value] of Object.entries(env)) {
    // Skip Vite internal variables
    if (key.startsWith('VITE_') && typeof value === 'string') {
      // Check if it looks like a secret key
      const isPublicKeyPrefix = PUBLIC_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
      
      if (!isPublicKeyPrefix && (value.includes('secret') || value.includes('sk_'))) {
        issues.push(`Environment variable ${key} may contain a secret key`);
      }
      
      // Validate the value doesn't contain exposed keys
      const validation = validateNoExposedKeys(value, `env.${key}`);
      if (!validation.safe) {
        issues.push(...validation.violations);
      }
    }
  }
  
  return {
    safe: issues.length === 0,
    issues
  };
}

/**
 * Runtime API key validator for user-provided keys
 */
export function validateUserApiKey(
  key: string,
  keyType: 'groq' | 'openrouter' | 'e2b'
): { valid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API key is required' };
  }
  
  // Remove whitespace
  const trimmedKey = key.trim();
  
  // Check minimum length
  if (trimmedKey.length < 20) {
    return { valid: false, error: 'API key is too short' };
  }
  
  // Check maximum length
  if (trimmedKey.length > 200) {
    return { valid: false, error: 'API key is too long' };
  }
  
  // Type-specific validation
  switch (keyType) {
    case 'groq':
      if (!trimmedKey.startsWith('gsk_')) {
        return { valid: false, error: 'Groq API key should start with "gsk_"' };
      }
      break;
      
    case 'openrouter':
      if (!trimmedKey.startsWith('sk-or-')) {
        return { valid: false, error: 'OpenRouter API key should start with "sk-or-"' };
      }
      break;
      
    case 'e2b':
      if (!trimmedKey.startsWith('e2b_')) {
        return { valid: false, error: 'E2B API key should start with "e2b_"' };
      }
      break;
  }
  
  // Check for common mistakes
  if (trimmedKey.includes(' ')) {
    return { valid: false, error: 'API key should not contain spaces' };
  }
  
  if (trimmedKey.includes('your-api-key') || trimmedKey.includes('YOUR_API_KEY')) {
    return { valid: false, error: 'Please enter your actual API key' };
  }
  // Check character set (alphanumeric + common separators)
  const validCharPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validCharPattern.test(trimmedKey)) {
    return { valid: false, error: 'API key contains invalid characters' };
  }
  return { valid: true };
}

/**
 * Sanitize API key for logging (show only prefix)
 */
export function sanitizeApiKeyForLogging(key: string): string {
  if (!key || key.length < 10) {
    return '[invalid]';
  }
  
  const prefix = key.substring(0, 8);
  const suffix = key.substring(key.length - 4);
  const maskedLength = key.length - 12;
  
  return `${prefix}${'*'.repeat(Math.min(maskedLength, 20))}${suffix}`;
}

/**
 * Check if running in production with proper API key configuration
 */
export function validateProductionApiConfig(): {
  ready: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if we're in production
  const isProduction = import.meta.env.MODE === 'production';
  
  if (isProduction) {
    // Critical: Groq API key should be configured
    if (!import.meta.env.VITE_GROQ_API_KEY) {
      errors.push('No Groq API key configured for production');
    }
    
    // Warning: OpenRouter as fallback
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      warnings.push('No OpenRouter API key configured (fallback AI provider)');
    }
    
    // Warning: E2B for code execution
    if (!import.meta.env.VITE_E2B_API_KEY) {
      warnings.push('No E2B API key configured (code execution disabled)');
    }
    
    // Check for test keys in production
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (groqKey && (groqKey.includes('test') || groqKey.includes('demo'))) {
      errors.push('Test API key detected in production environment');
    }
  }
  
  // Validate environment variables don't contain secrets
  const envValidation = validateEnvironmentVariables();
  if (!envValidation.safe) {
    errors.push(...envValidation.issues);
  }
  
  return {
    ready: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Initialize API key security monitoring
 */
export function initializeApiKeySecurity(): void {
  // Only run in production
  if (import.meta.env.MODE !== 'production') {
    return;
  }
  
  // Validate configuration on startup
  const validation = validateProductionApiConfig();
  
  if (!validation.ready) {
    logger.error('API Configuration Issues', {
      errors: validation.errors,
      warnings: validation.warnings
    });
    
    // Send critical alert
    Sentry.captureMessage('Production API Configuration Issues', {
      level: 'error',
      tags: {
        category: 'security',
        subsystem: 'api_keys'
      },
      extra: validation
    });
  } else if (validation.warnings.length > 0) {
    logger.warn('API Configuration Warnings', {
      warnings: validation.warnings
    });
  }
  
  // Set up periodic validation (every hour)
  setInterval(() => {
    const revalidation = validateProductionApiConfig();
    if (!revalidation.ready) {
      logger.error('API Configuration degraded', revalidation);
    }
  }, 60 * 60 * 1000); // 1 hour
}