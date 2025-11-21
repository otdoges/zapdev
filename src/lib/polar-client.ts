import { Polar } from "@polar-sh/sdk";
import { hasEnvVar, validatePolarEnv } from "./env-validation";

const PLACEHOLDER_TOKEN = "polar-placeholder-token";

let polarClientInstance: Polar | null = null;

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function resolveServer(): "sandbox" | "production" {
  const configured = process.env.POLAR_SERVER?.toLowerCase();

  if (configured === "production") {
    return "production";
  }

  if (configured === "sandbox") {
    return "sandbox";
  }

  // Default to sandbox unless explicitly in production mode
  return process.env.NODE_ENV === "production" ? "production" : "sandbox";
}

function createPolarClient(): Polar {
  const buildPhase = isBuildPhase();
  validatePolarEnv(!buildPhase);

  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    if (buildPhase) {
      console.warn("⚠️  POLAR_ACCESS_TOKEN not configured. Using placeholder client for build.");
      return new Polar({
        accessToken: PLACEHOLDER_TOKEN,
        server: "sandbox",
      });
    }

    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }

  return new Polar({
    accessToken,
    server: resolveServer(),
  });
}

export function getPolarClient(): Polar {
  if (!polarClientInstance) {
    polarClientInstance = createPolarClient();
  }

  return polarClientInstance;
}

export const polarClient = new Proxy({} as Polar, {
  get(_target, prop) {
    return getPolarClient()[prop as keyof Polar];
  },
});

export function isPolarConfigured(): boolean {
  return (
    hasEnvVar("POLAR_ACCESS_TOKEN") &&
    hasEnvVar("NEXT_PUBLIC_POLAR_ORGANIZATION_ID") &&
    hasEnvVar("POLAR_WEBHOOK_SECRET")
  );
}

export function getPolarOrganizationId(): string {
  const orgId = process.env.NEXT_PUBLIC_POLAR_ORGANIZATION_ID?.trim();
  if (!orgId) {
    throw new Error("NEXT_PUBLIC_POLAR_ORGANIZATION_ID is not configured");
  }
  return orgId;
}

export function getPolarProProductId(): string {
  const productId = process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID?.trim();
  if (!productId) {
    throw new Error("NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID is not configured");
  }
  return productId;
}

export function getPolarWebhookSecret(): string {
  const secret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("POLAR_WEBHOOK_SECRET is not configured");
  }
  return secret;
}
