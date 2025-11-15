/**
 * Environment variable validation utilities
 * Provides runtime validation and helpful error messages for missing/invalid environment variables
 */

interface EnvValidationError {
  variable: string;
  issue: string;
  setupInstructions?: string;
}

/**
 * Validate Polar.sh environment variables
 * Throws descriptive errors if variables are missing or malformed
 */
export function validatePolarEnv(): void {
  const errors: EnvValidationError[] = [];

  // Validate POLAR_ACCESS_TOKEN
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    errors.push({
      variable: 'POLAR_ACCESS_TOKEN',
      issue: 'Environment variable is not set',
      setupInstructions: 
        '1. Login to https://polar.sh\n' +
        '2. Go to Settings → API Keys\n' +
        '3. Create an Organization Access Token\n' +
        '4. Add to Vercel: Project Settings → Environment Variables → Add\n' +
        '5. Redeploy your application'
    });
  } else if (accessToken.trim() !== accessToken) {
    errors.push({
      variable: 'POLAR_ACCESS_TOKEN',
      issue: 'Contains leading or trailing whitespace',
      setupInstructions: 'Remove whitespace from the token value'
    });
  } else if (accessToken.trim().length === 0) {
    errors.push({
      variable: 'POLAR_ACCESS_TOKEN',
      issue: 'Is empty or contains only whitespace',
      setupInstructions: 'Provide a valid Organization Access Token from Polar.sh'
    });
  } else if (process.env.NODE_ENV === 'production' && !accessToken.startsWith('polar_at_')) {
    errors.push({
      variable: 'POLAR_ACCESS_TOKEN',
      issue: 'Token format appears invalid (should start with "polar_at_")',
      setupInstructions: 
        'Regenerate your Organization Access Token:\n' +
        '1. Go to https://polar.sh → Settings → API Keys\n' +
        '2. Delete the old token\n' +
        '3. Create a new Organization Access Token\n' +
        '4. Update in Vercel environment variables'
    });
  }

  // Validate NEXT_PUBLIC_POLAR_ORGANIZATION_ID
  const orgId = process.env.NEXT_PUBLIC_POLAR_ORGANIZATION_ID;
  if (!orgId) {
    errors.push({
      variable: 'NEXT_PUBLIC_POLAR_ORGANIZATION_ID',
      issue: 'Environment variable is not set',
      setupInstructions: 
        'Find your Organization ID in Polar.sh dashboard and add to environment variables'
    });
  } else if (orgId.trim() !== orgId || orgId.trim().length === 0) {
    errors.push({
      variable: 'NEXT_PUBLIC_POLAR_ORGANIZATION_ID',
      issue: 'Contains whitespace or is empty',
      setupInstructions: 'Provide a valid Organization ID without whitespace'
    });
  }

  // Validate POLAR_WEBHOOK_SECRET
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    errors.push({
      variable: 'POLAR_WEBHOOK_SECRET',
      issue: 'Environment variable is not set',
      setupInstructions: 
        '1. Go to https://polar.sh → Settings → Webhooks\n' +
        '2. Add endpoint: https://your-domain.com/api/webhooks/polar\n' +
        '3. Copy the webhook secret\n' +
        '4. Add to Vercel environment variables'
    });
  } else if (webhookSecret.trim() !== webhookSecret || webhookSecret.trim().length === 0) {
    errors.push({
      variable: 'POLAR_WEBHOOK_SECRET',
      issue: 'Contains whitespace or is empty',
      setupInstructions: 'Provide a valid webhook secret without whitespace'
    });
  }

  // Validate NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID (optional, but warn if missing)
  const productId = process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID;
  if (!productId) {
    console.warn(
      '⚠️  NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID is not set. ' +
      'Create a Pro product in Polar.sh dashboard and add the product ID to environment variables.'
    );
  }

  // Throw if any critical errors found
  if (errors.length > 0) {
    const errorMessage = formatEnvErrors(errors);
    throw new Error(errorMessage);
  }
}

/**
 * Format environment validation errors into a readable message
 */
function formatEnvErrors(errors: EnvValidationError[]): string {
  let message = '\n\n🚨 Polar.sh Configuration Error\n\n';
  message += 'The following environment variables have issues:\n\n';

  errors.forEach((error, index) => {
    message += `${index + 1}. ${error.variable}\n`;
    message += `   Issue: ${error.issue}\n`;
    if (error.setupInstructions) {
      message += `   Setup:\n`;
      error.setupInstructions.split('\n').forEach(line => {
        message += `   ${line}\n`;
      });
    }
    message += '\n';
  });

  message += '📚 For detailed setup instructions, see:\n';
  message += '   - explanations/POLAR_INTEGRATION.md\n';
  message += '   - explanations/DEPLOYMENT_VERIFICATION.md\n\n';

  return message;
}

/**
 * Check if environment variable exists and is non-empty
 */
export function hasEnvVar(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

/**
 * Get sanitized error details for logging (without exposing secrets)
 */
export function getSanitizedErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for common Polar API error patterns
    if (message.includes('401') || message.includes('invalid_token')) {
      return 'Authentication failed: Token is invalid, expired, or revoked';
    }
    if (message.includes('403') || message.includes('forbidden')) {
      return 'Access forbidden: Check organization permissions';
    }
    if (message.includes('404')) {
      return 'Resource not found: Check product ID or organization ID';
    }
    
    return message;
  }
  
  return 'Unknown error occurred';
}
