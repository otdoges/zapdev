import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./helpers";

/**
 * Get the current user's active subscription
 */
export const getSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return subscription;
  },
});

/**
 * Get subscription by external subscription ID (for webhook handlers)
 */
export const getSubscriptionByExternalId = query({
  args: {
    externalSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_externalSubscriptionId", (q) =>
        q.eq("externalSubscriptionId", args.externalSubscriptionId)
      )
      .first();

    return subscription;
  },
});

/**
 * Create or update a subscription (called from webhook handlers)
 */
export const upsertSubscription = mutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    externalCustomerId: v.optional(v.string()),
    externalSubscriptionId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if subscription already exists for this user
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        externalCustomerId: args.externalCustomerId,
        externalSubscriptionId: args.externalSubscriptionId,
        metadata: args.metadata,
        updatedAt: now,
      });

      return existing._id;
    } else {
      // Create new subscription
      const subscriptionId = await ctx.db.insert("subscriptions", {
        userId: args.userId,
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        externalCustomerId: args.externalCustomerId,
        externalSubscriptionId: args.externalSubscriptionId,
        metadata: args.metadata,
        createdAt: now,
        updatedAt: now,
      });

      return subscriptionId;
    }
  },
});

/**
 * Cancel a subscription (sets cancelAtPeriodEnd flag)
 */
export const cancelSubscription = mutation({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId ?? (await requireAuth(ctx));

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    await ctx.db.patch(subscription._id, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });

    return subscription._id;
  },
});

/**
 * Reactivate a canceled subscription
 */
export const reactivateSubscription = mutation({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId ?? (await requireAuth(ctx));

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(subscription._id, {
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    });

    return subscription._id;
  },
});

/**
 * Update subscription status (e.g., from active to canceled)
 */
export const updateSubscriptionStatus = mutation({
  args: {
    externalSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_externalSubscriptionId", (q) =>
        q.eq("externalSubscriptionId", args.externalSubscriptionId)
      )
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(subscription._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return subscription._id;
  },
});

/**
 * Get all subscriptions for a user (admin/debug function)
 */
export const getUserSubscriptions = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return subscriptions;
  },
});
