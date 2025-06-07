import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const getOrCreateUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, email, firstName, lastName, avatarUrl } = args;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) {
      return existingUser;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      clerkId,
      email,
      firstName,
      lastName,
      avatarUrl,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Public mutation to create or update a user
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, email, firstName, lastName, avatarUrl } = args;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      return await ctx.db.patch(existingUser._id, {
        email,
        firstName,
        lastName,
        avatarUrl,
        updatedAt: now,
      });
    }

    return await ctx.db.insert("users", {
      clerkId,
      email,
      firstName,
      lastName,
      avatarUrl,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update user subscription details from webhook
export const updateUserSubscription = mutation({
  args: {
    clerkId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    planType: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { clerkId, stripeCustomerId, stripeSubscriptionId, planType, isActive } = args;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!existingUser) {
      throw new Error("User not found");
    }

    return await ctx.db.patch(existingUser._id, {
      stripeCustomerId,
      stripeSubscriptionId,
      stripeSubscriptionStatus: isActive ? "active" : "inactive",
      stripePriceId: planType,
      updatedAt: Date.now(),
    });
  },
});

// Update subscription status only
export const updateSubscriptionStatus = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { stripeSubscriptionId, isActive } = args;

    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("stripeSubscriptionId"), stripeSubscriptionId))
      .first();

    if (!existingUser) {
      throw new Error("User with this subscription ID not found");
    }

    return await ctx.db.patch(existingUser._id, {
      stripeSubscriptionStatus: isActive ? "active" : "inactive",
      updatedAt: Date.now(),
    });
  },
}); 