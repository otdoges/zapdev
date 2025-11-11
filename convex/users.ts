import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get user by email
 */
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});

/**
 * Get user by Polar customer ID
 */
export const getByPolarCustomerId = query({
  args: {
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_polarCustomerId", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId)
      )
      .first();

    return user;
  },
});

/**
 * Update user's subscription information from Polar webhook
 */
export const updateSubscription = mutation({
  args: {
    polarCustomerId: v.string(),
    subscriptionId: v.string(),
    subscriptionStatus: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    // Find user by Polar customer ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_polarCustomerId", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId)
      )
      .first();

    if (!user) {
      throw new Error(
        `User not found for Polar customer ID: ${args.polarCustomerId}`
      );
    }

    // Update subscription details
    await ctx.db.patch(user._id, {
      subscriptionId: args.subscriptionId,
      subscriptionStatus: args.subscriptionStatus,
      plan: args.plan,
      updatedAt: Date.now(),
    });

    return { success: true, userId: user._id };
  },
});

/**
 * Link Polar customer ID to user
 */
export const linkPolarCustomer = mutation({
  args: {
    userId: v.id("users"),
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      polarCustomerId: args.polarCustomerId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get user's subscription status
 */
export const getSubscriptionStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    return {
      plan: user.plan || "free",
      subscriptionStatus: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
      polarCustomerId: user.polarCustomerId,
    };
  },
});

/**
 * Create or update user (for Better Auth integration)
 */
export const createOrUpdate = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        image: args.image,
        emailVerified: args.emailVerified,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      image: args.image,
      emailVerified: args.emailVerified ?? false,
      plan: "free",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});
