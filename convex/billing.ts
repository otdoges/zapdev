import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Sync user subscription from Clerk billing webhook
export const syncUserSubscription = mutation({
  args: {
    userId: v.string(),
    planId: v.string(),
    planName: v.string(),
    planType: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("incomplete"),
      v.literal("trialing"),
      v.literal("none")
    ),
    features: v.array(v.string()),
    usageLimits: v.object({
      maxConversations: v.optional(v.number()),
      maxCodeExecutions: v.optional(v.number()),
      hasAdvancedFeatures: v.boolean(),
    }),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existingSubscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        planId: args.planId,
        planName: args.planName,
        planType: args.planType,
        status: args.status,
        features: args.features,
        usageLimits: args.usageLimits,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        resetDate: args.currentPeriodEnd, // Usage resets at end of period
        updatedAt: now,
      });
      return existingSubscription._id;
    } else {
      // Create new subscription
      return await ctx.db.insert("userSubscriptions", {
        userId: args.userId,
        planId: args.planId,
        planName: args.planName,
        planType: args.planType,
        status: args.status,
        features: args.features,
        usageLimits: args.usageLimits,
        currentUsage: {
          conversationsUsed: 0,
          codeExecutionsUsed: 0,
        },
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        resetDate: args.currentPeriodEnd,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get user subscription info
export const getUserSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Check if user has a specific feature
export const hasFeature = query({
  args: { 
    userId: v.string(),
    feature: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      return false;
    }

    return subscription.features.includes(args.feature);
  },
});

// Check if user has a specific plan
export const hasPlan = query({
  args: { 
    userId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      return false;
    }

    return subscription.planType === args.plan;
  },
});

// Track usage event for billing
export const trackUsage = mutation({
  args: {
    userId: v.string(),
    eventName: v.string(),
    metadata: v.object({
      requests: v.optional(v.number()),
      duration: v.optional(v.number()),
      size: v.optional(v.number()),
      conversationId: v.optional(v.string()),
      codeExecutionId: v.optional(v.string()),
      model: v.optional(v.string()),
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
      cost: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("usageEvents", {
      eventName: args.eventName,
      userId: args.userId,
      metadata: args.metadata,
      ingested: false,
      timestamp: now,
      createdAt: now,
    });
  },
});

// Update current usage counters
export const updateUsage = mutation({
  args: {
    userId: v.string(),
    conversationsIncrement: v.optional(v.number()),
    codeExecutionsIncrement: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      throw new Error("No subscription found for user");
    }

    const now = Date.now();
    const newUsage = {
      conversationsUsed: subscription.currentUsage.conversationsUsed + (args.conversationsIncrement || 0),
      codeExecutionsUsed: subscription.currentUsage.codeExecutionsUsed + (args.codeExecutionsIncrement || 0),
    };

    await ctx.db.patch(subscription._id, {
      currentUsage: newUsage,
      updatedAt: now,
    });

    return newUsage;
  },
});

// Reset usage counters (called at billing period start)
export const resetUsage = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      throw new Error("No subscription found for user");
    }

    await ctx.db.patch(subscription._id, {
      currentUsage: {
        conversationsUsed: 0,
        codeExecutionsUsed: 0,
      },
      updatedAt: Date.now(),
    });
  },
});

// Check if user is within usage limits
export const checkUsageLimits = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      return {
        canCreateConversation: false,
        canExecuteCode: false,
        conversationsRemaining: 0,
        codeExecutionsRemaining: 0,
      };
    }

    const conversationsRemaining = subscription.usageLimits.maxConversations 
      ? Math.max(0, subscription.usageLimits.maxConversations - subscription.currentUsage.conversationsUsed)
      : Infinity;
    
    const codeExecutionsRemaining = subscription.usageLimits.maxCodeExecutions
      ? Math.max(0, subscription.usageLimits.maxCodeExecutions - subscription.currentUsage.codeExecutionsUsed)
      : Infinity;

    return {
      canCreateConversation: conversationsRemaining > 0,
      canExecuteCode: codeExecutionsRemaining > 0,
      conversationsRemaining: conversationsRemaining === Infinity ? -1 : conversationsRemaining,
      codeExecutionsRemaining: codeExecutionsRemaining === Infinity ? -1 : codeExecutionsRemaining,
    };
  },
});