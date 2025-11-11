import { Polar } from "@polar-sh/sdk";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Require an environment variable to be set, throw if missing
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Initialize Polar SDK
export const polar = new Polar({
  accessToken: requireEnv("POLAR_ACCESS_TOKEN"),
});

export const POLAR_CONFIG = {
  organizationId: requireEnv("POLAR_ORGANIZATION_ID"),
  productIdPro: requireEnv("NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO"),
  webhookSecret: requireEnv("POLAR_WEBHOOK_SECRET"),
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
}) {
  try {
    // Try to find existing customer by email
    const customers = await polar.customers.list({
      organizationId: POLAR_CONFIG.organizationId,
      email: params.email,
    });

    if (customers.result && customers.result.items.length > 0) {
      return { success: true, customer: customers.result.items[0] };
    }

    // Create new customer
    const customer = await polar.customers.create({
      organizationId: POLAR_CONFIG.organizationId,
      email: params.email,
      name: params.name,
      metadata: {
        userId: params.userId,
      },
    });

    return { success: true, customer };
  } catch (error) {
    console.error("Failed to get/create customer:", error);
    return { success: false, error };
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
    // Polar uses HMAC SHA256 for webhook signatures
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    // Ensure both strings are same length before comparison
    // timingSafeEqual will throw if lengths differ
    if (signature.length !== expectedSignature.length) {
      console.warn("Webhook signature length mismatch");
      return false;
    }

    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return false;
  }
}
