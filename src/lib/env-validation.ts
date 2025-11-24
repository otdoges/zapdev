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
