import type { QueryCtx, MutationCtx } from "./_generated/server";
import { components } from "./_generated/api";
import { Autumn } from "@useautumn/convex";

const secretKey = process.env.AUTUMN_SECRET_KEY;

// In production, the secret key is required
// In development, allow graceful degradation
if (!secretKey) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTUMN_SECRET_KEY environment variable is required but not set. " +
      "Please configure this variable in your deployment settings."
    );
  }
  // In development, log a warning but continue
  console.warn(
    "[Autumn] AUTUMN_SECRET_KEY not set. Billing features will be unavailable. " +
    "Set AUTUMN_SECRET_KEY in your environment to enable billing."
  );
}

// Use a dummy key for development if not set
const effectiveSecretKey = secretKey || "dev-placeholder-key";

export const autumn = new Autumn(components.autumn, {
  secretKey: effectiveSecretKey,
  identify: async (ctx: QueryCtx | MutationCtx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return null;

    return {
      customerId: user.subject ?? user.tokenIdentifier,
      customerData: {
        name: user.name ?? "Unknown",
        email: user.email ?? user.emailAddress ?? "noreply@example.com",
      },
    };
  },
});

/**
 * These exports are required for our react hooks and components
 */
export const {
  track,
  cancel,
  query,
  attach,
  check,
  checkout,
  usage,
  setupPayment,
  createCustomer,
  listProducts,
  billingPortal,
  createReferralCode,
  redeemReferralCode,
  createEntity,
  getEntity,
} = autumn.api();
