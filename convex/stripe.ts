import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// Product management functions
export const syncProducts = mutation({
  args: {
    products: v.array(v.object({
      stripeId: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      active: v.boolean(),
      metadata: v.optional(v.object({})),
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const product of args.products) {
      const existing = await ctx.db
        .query("stripeProducts")
        .withIndex("by_stripe_id", q => q.eq("stripeId", product.stripeId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...product,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("stripeProducts", {
          ...product,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

export const getProducts = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (!args.includeInactive) {
      return await ctx.db
        .query("stripeProducts")
        .withIndex("by_active", q => q.eq("active", true))
        .collect();
    }
    
    return await ctx.db.query("stripeProducts").collect();
  },
});

export const getProductById = query({
  args: { productId: v.id("stripeProducts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

// Price management functions
export const syncPrices = mutation({
  args: {
    prices: v.array(v.object({
      stripeId: v.string(),
      productId: v.id("stripeProducts"),
      stripeProductId: v.string(),
      type: v.union(v.literal("one_time"), v.literal("recurring")),
      recurringInterval: v.optional(v.union(v.literal("month"), v.literal("year"))),
      unitAmount: v.optional(v.number()),
      currency: v.string(),
      active: v.boolean(),
      metadata: v.optional(v.object({})),
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const price of args.prices) {
      const existing = await ctx.db
        .query("stripePrices")
        .withIndex("by_stripe_id", q => q.eq("stripeId", price.stripeId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...price,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("stripePrices", {
          ...price,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

export const getPricesForProduct = query({
  args: { productId: v.id("stripeProducts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stripePrices")
      .withIndex("by_product", q => q.eq("productId", args.productId))
      .collect();
  },
});

export const getActivePrices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stripePrices")
      .withIndex("by_active", q => q.eq("active", true))
      .collect();
  },
});

// Customer management functions
export const upsertCustomer = mutation({
  args: {
    stripeId: v.string(),
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    metadata: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        stripeId: args.stripeId,
        email: args.email,
        name: args.name,
        metadata: args.metadata,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("stripeCustomers", {
        stripeId: args.stripeId,
        userId: args.userId,
        email: args.email,
        name: args.name,
        metadata: args.metadata,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getCustomerByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stripeCustomers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();
  },
});

export const getCustomerByStripeId = query({
  args: { stripeId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stripeCustomers")
      .withIndex("by_stripe_id", q => q.eq("stripeId", args.stripeId))
      .unique();
  },
});

// Subscription management functions
export const upsertSubscription = mutation({
  args: {
    stripeId: v.string(),
    customerId: v.id("stripeCustomers"),
    stripeCustomerId: v.string(),
    productId: v.id("stripeProducts"),
    stripeProductId: v.string(),
    priceId: v.id("stripePrices"),
    stripePriceId: v.string(),
    status: v.union(
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("paused")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()),
    metadata: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("stripeSubscriptions")
      .withIndex("by_stripe_id", q => q.eq("stripeId", args.stripeId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("stripeSubscriptions", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getUserSubscriptions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();

    if (!customer) return [];

    const subscriptions = await ctx.db
      .query("stripeSubscriptions")
      .withIndex("by_customer", q => q.eq("customerId", customer._id))
      .collect();

    // Get product and price details for each subscription
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        const product = await ctx.db.get(sub.productId);
        const price = await ctx.db.get(sub.priceId);
        return { ...sub, product, price };
      })
    );

    return enrichedSubscriptions;
  },
});

export const getActiveSubscriptionByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();

    if (!customer) return null;

    const activeSubscription = await ctx.db
      .query("stripeSubscriptions")
      .withIndex("by_customer", q => q.eq("customerId", customer._id))
      .filter(q => q.eq(q.field("status"), "active"))
      .first();

    if (!activeSubscription) return null;

    const product = await ctx.db.get(activeSubscription.productId);
    const price = await ctx.db.get(activeSubscription.priceId);

    return { ...activeSubscription, product, price };
  },
});

// Usage tracking functions
export const recordUsageEvent = mutation({
  args: {
    eventName: v.string(),
    userId: v.string(),
    metadata: v.object({
      requests: v.optional(v.number()),
      duration: v.optional(v.number()),
      size: v.optional(v.number()),
      additionalProperties: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get customer info if available
    const customer = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();

    return await ctx.db.insert("usageEvents", {
      eventName: args.eventName,
      userId: args.userId,
      customerId: customer?.stripeId,
      metadata: args.metadata,
      ingested: false, // Will be set to true when sent to billing provider
      timestamp: now,
      createdAt: now,
    });
  },
});

export const getUserUsageStats = query({
  args: { 
    userId: v.string(),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sinceTimestamp = args.since || (Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    
    const events = await ctx.db
      .query("usageEvents")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .filter(q => q.gte(q.field("timestamp"), sinceTimestamp))
      .collect();

    // Aggregate stats by event type
    const stats: Record<string, { count: number; totalRequests: number; totalDuration: number; totalSize: number }> = {};
    
    for (const event of events) {
      if (!stats[event.eventName]) {
        stats[event.eventName] = { count: 0, totalRequests: 0, totalDuration: 0, totalSize: 0 };
      }
      
      stats[event.eventName].count++;
      stats[event.eventName].totalRequests += event.metadata.requests || 0;
      stats[event.eventName].totalDuration += event.metadata.duration || 0;
      stats[event.eventName].totalSize += event.metadata.size || 0;
    }

    return {
      totalEvents: events.length,
      period: { since: sinceTimestamp, until: Date.now() },
      byEventType: stats,
    };
  },
});

// User subscription cache management
export const updateUserSubscriptionCache = mutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    isActive: v.boolean(),
    planName: v.string(),
    planType: v.union(v.literal("free"), v.literal("starter"), v.literal("professional"), v.literal("enterprise")),
    features: v.array(v.string()),
    usageLimits: v.object({
      maxProjects: v.optional(v.number()),
      storageLimit: v.optional(v.number()),
    }),
    currentUsage: v.object({
      projectsCreated: v.number(),
      storageUsed: v.number(),
    }),
    resetDate: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("userSubscriptions", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getUserSubscriptionCache = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();
  },
});
