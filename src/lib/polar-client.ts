import { Polar } from "@polar-sh/sdk";
import { validatePolarEnv, hasEnvVar } from "./env-validation";

/**
 * Cached Polar client instance (lazy-initialized)
 */
let polarClientInstance: Polar | null = null;

/**
 * Initialize Polar client with validation
 * Validates environment variables before creating client instance
 * 
 * @throws Error if Polar is not properly configured
 */
function createPolarClient(): Polar {
  // Don't validate during build - just warn
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  
  // Validate all Polar environment variables
  try {
    validatePolarEnv(!isBuildTime); // Only throw errors at runtime
  } catch (error) {
    console.error('❌ Polar client initialization failed:', error instanceof Error ? error.message : error);
    throw error;
  }

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  
  // Additional runtime validation
  if (!accessToken || accessToken.trim().length === 0) {
    const errorMsg = 
      'POLAR_ACCESS_TOKEN is not configured. ' +
      'Please add your Organization Access Token from https://polar.sh/settings/api-keys ' +
      'to your environment variables in Vercel dashboard.';
    
    if (isBuildTime) {
      console.warn('⚠️ ', errorMsg);
      // Return a dummy client during build that will fail at runtime if actually used
      return new Polar({ accessToken: 'build-time-placeholder' });
    }
    
    throw new Error(errorMsg);
  }

  return new Polar({
    accessToken: accessToken.trim(),
    // FORCED SANDBOX MODE: Always use sandbox to prevent real payments
    // To enable production mode, change "sandbox" to conditional logic based on NODE_ENV
    server: "sandbox",
  });
}

/**
 * Get Polar.sh SDK client for server-side operations (lazy-initialized)
 * Uses Organization Access Token for full API access
 * 
 * @returns Polar client instance
 * @throws Error if Polar is not properly configured
 */
export function getPolarClient(): Polar {
  if (!polarClientInstance) {
    polarClientInstance = createPolarClient();
  }
  return polarClientInstance;
}

/**
 * @deprecated Use getPolarClient() instead
 * Lazy proxy for backward compatibility - allows build to succeed even without Polar config
 */
export const polarClient = new Proxy({} as Polar, {
  get(_target, prop) {
    // Lazy-load the client only when a property is accessed
    return getPolarClient()[prop as keyof Polar];
  }
});

/**
 * Get the Polar organization ID from environment
 */
export function getPolarOrganizationId(): string {
  const orgId = process.env.NEXT_PUBLIC_POLAR_ORGANIZATION_ID;
  if (!orgId || orgId.trim().length === 0) {
    throw new Error(
      "NEXT_PUBLIC_POLAR_ORGANIZATION_ID environment variable is not set. " +
      "Please add your organization ID from Polar.sh dashboard to environment variables."
    );
  }
  return orgId.trim();
}

/**
 * Get the Polar webhook secret for signature verification
 */
export function getPolarWebhookSecret(): string {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "POLAR_WEBHOOK_SECRET environment variable is not set. " +
      "Please add your webhook secret from Polar.sh webhook settings to environment variables."
    );
  }
  return secret.trim();
}

/**
 * Check if Polar is properly configured
 * Useful for conditional feature rendering
 */
export function isPolarConfigured(): boolean {
  return (
    hasEnvVar('POLAR_ACCESS_TOKEN') &&
    hasEnvVar('NEXT_PUBLIC_POLAR_ORGANIZATION_ID') &&
    hasEnvVar('POLAR_WEBHOOK_SECRET')
  );
}
