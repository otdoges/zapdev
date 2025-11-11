import { Polar } from "@polar-sh/sdk";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Get an environment variable, return undefined if missing
 */
function getEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Require an environment variable to be set, throw if missing (at runtime)
 */
function requireEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Initialize Polar SDK lazily to avoid build-time errors
let _polar: Polar | undefined;
export const getPolar = (): Polar => {
  if (!_polar) {
    _polar = new Polar({
      accessToken: requireEnv("POLAR_ACCESS_TOKEN"),
    });
  }
  return _polar;
};

// For backward compatibility
export const polar = new Proxy({} as Polar, {
  get(target, prop) {
    return (getPolar() as any)[prop];
  }
});

// Lazy config getters to avoid build-time errors
export const POLAR_CONFIG = {
  get organizationId() {
    return requireEnv("POLAR_ORGANIZATION_ID");
  },
  get productIdPro() {
    return requireEnv("NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO");
  },
  get webhookSecret() {
    return requireEnv("POLAR_WEBHOOK_SECRET");
  },
};

/**
 * Create a checkout session for a user to subscribe
 */
export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail: string;
  productId: string;
  successUrl: string;
  customerName?: string;
}) {
  try {
    const checkout = await polar.checkouts.create({
      products: [params.productId],
      successUrl: params.successUrl,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      customerId: params.customerId,
    });

    return { success: true, checkout };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return { success: false, error };
  }
}

/**
 * Get or create a Polar customer for a user
 */
export async function getOrCreateCustomer(params: {
  email: string;
  name?: string;
  userId: string;
  idempotencyKey?: string;
}) {
  try {
    // Try to find existing customer by email
    const customers = await polar.customers.list({
      organizationId: POLAR_CONFIG.organizationId,
      email: params.email,
    });

    if (customers.result && customers.result.items.length > 0) {
      return {
        success: true,
        customer: customers.result.items[0],
        created: false,
      };
    }

    // Create new customer
    const requestOptions =
      params.idempotencyKey !== undefined
        ? { headers: { "Idempotency-Key": params.idempotencyKey } }
        : undefined;

    const customer = await polar.customers.create(
      {
        organizationId: POLAR_CONFIG.organizationId,
        email: params.email,
        name: params.name,
        metadata: {
          userId: params.userId,
        },
      },
      requestOptions
    );

    return { success: true, customer, created: true };
  } catch (error) {
    console.error("Failed to get/create customer:", error);
    return { success: false, error, created: false };
  }
}

/**
 * Get active subscription for a customer
 */
export async function getCustomerSubscription(customerId: string) {
  try {
    const subscriptions = await polar.subscriptions.list({
      customerId,
      active: true,
    });

    if (subscriptions.result && subscriptions.result.items.length > 0) {
      return { success: true, subscription: subscriptions.result.items[0] };
    }

    return { success: true, subscription: null };
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return { success: false, error };
  }
}

/**
 * Get customer portal URL for managing subscriptions
 */
export async function getCustomerPortalUrl(customerId: string) {
  try {
    const session = await polar.customerSessions.create({
      customerId,
    });

    return { success: true, url: session.customerPortalUrl };
  } catch (error) {
    console.error("Failed to create customer portal session:", error);
    return { success: false, error };
  }
}

/**
 * Check subscription status and return user plan
 */
export function getSubscriptionStatus(subscription: any): {
  plan: "free" | "pro";
  status: string | null;
  isActive: boolean;
} {
  if (!subscription) {
    return { plan: "free", status: null, isActive: false };
  }

  const status = subscription.status;
  const isActive = ["active", "trialing"].includes(status);

  return {
    plan: isActive ? "pro" : "free",
    status,
    isActive,
  };
}

/**
 * Verify webhook signature from Polar
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Polar platform webhooks sign payloads with a base64 HMAC SHA256 digest
    const secretBytes = Buffer.from(secret, "base64");
    if (secretBytes.length === 0) {
      console.error("Webhook verification failed: base64 secret decoded to empty value");
      return false;
    }

    const hmac = createHmac("sha256", secretBytes);
    hmac.update(payload);
    const expectedSignature = hmac.digest("base64");

    const providedSignature = signature.trim();
    if (providedSignature.length === 0) {
      console.warn("Webhook signature missing or empty");
      return false;
    }

    // Ensure both strings are same length before comparison
    // timingSafeEqual will throw if lengths differ
    if (providedSignature.length !== expectedSignature.length) {
      console.warn("Webhook base64 signature length mismatch");
      return false;
    }

    return timingSafeEqual(
      Buffer.from(providedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch (error) {
    console.error("Webhook base64 signature verification failed:", error);
    return false;
  }
}
