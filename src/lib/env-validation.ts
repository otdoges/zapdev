/**
 * Environment variable validation module.
 * 
 * Validates required environment variables at module initialization to fail fast
 * rather than during runtime when creating sandboxes or making API calls.
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVarConfig[] = [
  {
    name: 'E2B_API_KEY',
    required: true,
    description: 'E2B Code Interpreter API key for sandbox execution',
  },
  {
    name: 'AI_GATEWAY_API_KEY',
    required: true,
    description: 'Vercel AI Gateway API key for AI model access',
  },
  {
    name: 'SYSTEM_API_KEY',
    required: true,
    description: 'System-level API key for backend service authentication',
  },
];

/**
 * Validates that all required environment variables are set.
 * 
 * @throws {Error} If any required environment variables are missing
 */
export function validateRequiredEnvVars(): void {
  const missing: string[] = [];
  const details: string[] = [];

  for (const config of ENV_VARS) {
    if (config.required && !process.env[config.name]) {
      missing.push(config.name);
      details.push(`  - ${config.name}: ${config.description}`);
    }
  }

  if (missing.length > 0) {
    const errorMessage = [
      `Missing ${missing.length} required environment variable(s):`,
      ...details,
      '',
      'Please set these variables in your .env.local file or deployment environment.',
    ].join('\n');

    throw new Error(errorMessage);
  }
}

/**
 * Validates environment variables with detailed logging.
 * Returns true if all required variables are present, false otherwise.
 *
 * Useful for non-critical paths where you want to log warnings instead of throwing.
 */
export function checkEnvVars(): boolean {
  try {
    validateRequiredEnvVars();
    return true;
  } catch (error) {
    console.error('[Env Validation]', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Check if an environment variable exists and has a non-empty value
 *
 * @param name - The environment variable name to check
 * @returns true if the variable exists and is not empty, false otherwise
 */
export function hasEnvVar(name: string): boolean {
  const value = process.env[name];
  return value !== undefined && value !== null && value.trim().length > 0;
}

/**
 * Validates Polar.sh environment variables
 *
 * @param throwOnError - If true, throws an error when validation fails. If false, logs a warning.
 * @throws {Error} If throwOnError is true and validation fails
 */
export function validatePolarEnv(throwOnError = true): void {
  const polarEnvVars = [
    {
      name: 'POLAR_ACCESS_TOKEN',
      description: 'Polar.sh Organization Access Token from https://polar.sh/settings/api-keys',
      validate: (value: string) => {
        if (!value.startsWith('polar_at_')) {
          return 'Token format appears invalid (should start with "polar_at_")';
        }
        return null;
      }
    },
    {
      name: 'NEXT_PUBLIC_POLAR_ORGANIZATION_ID',
      description: 'Polar.sh Organization ID from dashboard',
    },
    {
      name: 'POLAR_WEBHOOK_SECRET',
      description: 'Polar.sh Webhook Secret from webhook settings',
    }
  ];

  const errors: string[] = [];

  for (const config of polarEnvVars) {
    const value = process.env[config.name];

    if (!value || value.trim().length === 0) {
      errors.push(`  - ${config.name}: Missing (${config.description})`);
    } else if (config.validate) {
      const validationError = config.validate(value);
      if (validationError) {
        errors.push(`  - ${config.name}: ${validationError}`);
      }
    }
  }

  if (errors.length > 0) {
    const errorMessage = [
      '🚨 Polar.sh Configuration Error',
      '',
      'The following environment variables have issues:',
      '',
      ...errors,
      '',
      'Please configure these in your .env.local file or Vercel dashboard.',
      'See explanations/POLAR_INTEGRATION.md for setup instructions.'
    ].join('\n');

    if (throwOnError) {
      throw new Error(errorMessage);
    } else {
      console.warn(errorMessage);
    }
  }
}

/**
 * Get sanitized error details that are safe to return to clients
 * Removes sensitive information like stack traces, file paths, and environment details
 *
 * @param error - The error to sanitize
 * @returns Sanitized error message safe for client consumption
 */
export function getSanitizedErrorDetails(error: Error | unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred';
  }

  const message = error.message;

  // Remove common sensitive patterns
  const sanitized = message
    // Remove file paths (both Unix and Windows)
    .replace(/\/[\w\-./]+/g, '[path]')
    .replace(/[A-Z]:\\[\w\-\\]+/g, '[path]')
    // Remove stack traces
    .replace(/\s+at\s+.*/g, '')
    // Remove environment variable values
    .replace(/=[^\s]+/g, '=[redacted]')
    // Remove API keys/tokens
    .replace(/[a-zA-Z0-9_-]{32,}/g, '[token]')
    // Remove URLs (keep the domain for context)
    .replace(/https?:\/\/[^\s]+/g, (url) => {
      try {
        const domain = new URL(url).hostname;
        return `https://${domain}/...`;
      } catch {
        return 'https://[url]';
      }
    });

  return sanitized.trim() || 'An error occurred during processing';
}
