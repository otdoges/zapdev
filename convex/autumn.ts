import type { QueryCtx, MutationCtx } from "./_generated/server";
import { components } from "./_generated/api";
import { Autumn } from "@useautumn/convex";

const secretKey = process.env.AUTUMN_SECRET_KEY;
if (!secretKey) {
  throw new Error(
    "AUTUMN_SECRET_KEY environment variable is required but not set. " +
    "Please configure this variable in your deployment settings."
  );
}

export const autumn = new Autumn(components.autumn, {
  secretKey,
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
