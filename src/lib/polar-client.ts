import { Polar } from "@polar-sh/sdk";

/**
 * Polar.sh SDK client for server-side operations
 * Uses Organization Access Token for full API access
 */
export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  // Use sandbox environment for development/testing
  server: process.env.NODE_ENV === "development" 
    ? "sandbox" 
    : "production",
});

/**
 * Get the Polar organization ID from environment
 */
export function getPolarOrganizationId(): string {
  const orgId = process.env.NEXT_PUBLIC_POLAR_ORGANIZATION_ID;
  if (!orgId) {
    throw new Error("NEXT_PUBLIC_POLAR_ORGANIZATION_ID environment variable is not set");
  }
  return orgId;
}

/**
 * Get the Polar webhook secret for signature verification
 */
export function getPolarWebhookSecret(): string {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("POLAR_WEBHOOK_SECRET environment variable is not set");
  }
  return secret;
}
