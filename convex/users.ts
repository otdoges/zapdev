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

// Get user by clerk ID - can only get your own user data
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Security check: Users can only get their own data
    if (identity.subject !== args.clerkId) {
      throw new Error("Unauthorized: You can only access your own user data");
    }
    
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get the current user's profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

// Public mutation to create or update a user.
// It is safe because it uses the user's identity from the session token.
export const createOrUpdateUser = mutation({
  args: {
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Cannot create or update user: not authenticated.");
    }

    // Use the authenticated user's Clerk ID from the session token
    const clerkId = identity.subject;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Only update the fields passed in args
      await ctx.db.patch(existingUser._id, {
        ...args,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("users", {
        clerkId, // from identity
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// INTERNAL: Update user subscription details from webhook
// This should only be called by the Stripe webhook handler
export const updateUserSubscription = internalMutation({
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

// INTERNAL: Update subscription status only
// This should only be called by the Stripe webhook handler
export const updateSubscriptionStatus = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { stripeSubscriptionId, isActive } = args;

    // Use the index for better performance
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_stripe_subscription_id", (q) => 
        q.eq("stripeSubscriptionId", stripeSubscriptionId)
      )
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