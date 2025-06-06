import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Get the stripe customer id for a user
export const getStripeCustomerId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
    return user?.stripeCustomerId;
  },
});

// Set the stripe customer id for a user
export const setStripeCustomerId = mutation({
  args: { clerkId: v.string(), stripeCustomerId: v.string() },
  handler: async (ctx, { clerkId, stripeCustomerId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { stripeCustomerId });
  },
});

// Update user subscription details
export const updateUserSubscription = mutation({
    args: {
        stripeCustomerId: v.string(),
        stripeSubscriptionId: v.string(),
        stripeSubscriptionStatus: v.string(),
        stripeCurrentPeriodEnd: v.number(),
        stripePriceId: v.string(),
    },
    handler: async (ctx, { stripeCustomerId, stripeSubscriptionId, stripeSubscriptionStatus, stripeCurrentPeriodEnd, stripePriceId }) => {
        const user = await ctx.db.query("users").filter((q) => q.eq(q.field("stripeCustomerId"), stripeCustomerId)).unique();

        if (!user) {
            throw new Error("User not found for this stripe customer id");
        }

        await ctx.db.patch(user._id, {
            stripeSubscriptionId,
            stripeSubscriptionStatus,
            stripeCurrentPeriodEnd,
            stripePriceId
        });
    }
}); 