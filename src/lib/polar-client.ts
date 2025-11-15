import { Polar } from "@polar-sh/sdk";
import { validatePolarEnv, hasEnvVar } from "./env-validation";

/**
 * Initialize Polar client with validation
 * Validates environment variables before creating client instance
 */
function createPolarClient(): Polar {
  // Validate all Polar environment variables
  try {
    validatePolarEnv();
  } catch (error) {
    console.error('❌ Polar client initialization failed:', error instanceof Error ? error.message : error);
    throw error;
  }

  const accessToken = process.env.POLAR_ACCESS_TOKEN!;
  
  // Additional runtime validation
  if (!accessToken || accessToken.trim().length === 0) {
    throw new Error(
      'POLAR_ACCESS_TOKEN is not configured. ' +
      'Please add your Organization Access Token from https://polar.sh/settings/api-keys ' +
      'to your environment variables in Vercel dashboard.'
    );
  }

  return new Polar({
    accessToken: accessToken.trim(),
    // Use sandbox environment for development/testing
    server: process.env.NODE_ENV === "development" 
      ? "sandbox" 
      : "production",
  });
}

/**
 * Polar.sh SDK client for server-side operations
 * Uses Organization Access Token for full API access
 */
export const polarClient = createPolarClient();

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
