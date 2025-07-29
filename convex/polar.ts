import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Product management functions
export const syncProducts = mutation({
  args: {
    products: v.array(v.object({
      polarId: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      type: v.union(v.literal("individual"), v.literal("business")),
      isRecurring: v.boolean(),
      isArchived: v.boolean(),
      organizationId: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const product of args.products) {
      // Check if product already exists
      const existing = await ctx.db
        .query("products")
        .withIndex("by_polar_id", q => q.eq("polarId", product.polarId))
        .unique();

      if (existing) {
        // Update existing product
        await ctx.db.patch(existing._id, {
          ...product,
          updatedAt: now,
        });
      } else {
        // Create new product
        await ctx.db.insert("products", {
          ...product,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

export const getProducts = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (!args.includeArchived) {
      return await ctx.db
        .query("products")
        .withIndex("by_active", q => q.eq("isArchived", false))
        .collect();
    }
    
    return await ctx.db.query("products").collect();
  },
});

export const getProductById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

// Price management functions
export const syncPrices = mutation({
  args: {
    prices: v.array(v.object({
      polarId: v.string(),
      productId: v.id("products"),
      polarProductId: v.string(),
      amountType: v.union(v.literal("fixed"), v.literal("free"), v.literal("custom")),
      type: v.union(v.literal("one_time"), v.literal("recurring")),
      recurringInterval: v.optional(v.union(v.literal("month"), v.literal("year"))),
      priceAmount: v.optional(v.number()),
      priceCurrency: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const price of args.prices) {
      const existing = await ctx.db
        .query("prices")
        .withIndex("by_polar_id", q => q.eq("polarId", price.polarId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...price,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("prices", {
          ...price,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

export const getPricesForProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prices")
      .withIndex("by_product", q => q.eq("productId", args.productId))
      .collect();
  },
});

// Customer management functions
export const syncCustomer = mutation({
  args: {
    polarId: v.string(),
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    externalId: v.optional(v.string()),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        polarId: args.polarId,
        email: args.email,
        name: args.name,
        externalId: args.externalId,
        organizationId: args.organizationId,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("customers", {
        polarId: args.polarId,
        userId: args.userId,
        email: args.email,
        name: args.name,
        externalId: args.externalId,
        organizationId: args.organizationId,
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
      .query("customers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();
  },
});

// Subscription management functions
export const syncSubscription = mutation({
  args: {
    polarId: v.string(),
    customerId: v.id("customers"),
    polarCustomerId: v.string(),
    productId: v.id("products"),
    polarProductId: v.string(),
    priceId: v.id("prices"),
    polarPriceId: v.string(),
    status: v.union(
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid")
    ),
    currentPeriodStart: v.string(),
    currentPeriodEnd: v.string(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_polar_id", q => q.eq("polarId", args.polarId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("subscriptions", {
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
      .query("customers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();

    if (!customer) return [];

    const subscriptions = await ctx.db
      .query("subscriptions")
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

export const getActiveSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();

    if (!customer) return null;

    const activeSubscription = await ctx.db
      .query("subscriptions")
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
      model: v.optional(v.string()),
      requests: v.optional(v.number()),
      totalTokens: v.optional(v.number()),
      requestTokens: v.optional(v.number()),
      responseTokens: v.optional(v.number()),
      duration: v.optional(v.number()),
      size: v.optional(v.number()),
      additionalProperties: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get customer info if available
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .unique();

    return await ctx.db.insert("usageEvents", {
      eventName: args.eventName,
      userId: args.userId,
      customerId: customer?._id,
      polarCustomerId: customer?.polarId,
      externalCustomerId: customer?.externalId,
      metadata: args.metadata,
      ingested: false, // Will be set to true when sent to Polar
      timestamp: now,
      createdAt: now,
    });
  },
});

export const getUnIngestedEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usageEvents")
      .withIndex("by_ingested", q => q.eq("ingested", false))
      .order("desc")
      .take(args.limit || 100);
  },
});

export const markEventAsIngested = mutation({
  args: { eventId: v.id("usageEvents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, { ingested: true });
  },
});

export const getUserUsageStats = query({
  args: { 
    userId: v.string(),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sinceTimestamp = args.since || (Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    
    const events = await ctx.db
      .query("usageEvents")
      .withIndex("by_user_id", q => q.eq("userId", args.userId))
      .filter(q => q.gte(q.field("timestamp"), sinceTimestamp))
      .collect();

    // Aggregate usage by event type
    const stats = events.reduce((acc, event) => {
      const eventType = event.eventName;
      if (!acc[eventType]) {
        acc[eventType] = {
          count: 0,
          totalTokens: 0,
          totalRequests: 0,
          totalDuration: 0,
          totalSize: 0,
        };
      }
      
      acc[eventType].count++;
      acc[eventType].totalTokens += (event.metadata as Record<string, unknown>).totalTokens as number || 0;
      acc[eventType].totalRequests += event.metadata.requests || 0;
      acc[eventType].totalDuration += event.metadata.duration || 0;
      acc[eventType].totalSize += event.metadata.size || 0;
      
      return acc;
    }, {} as Record<string, {
      count: number;
      totalTokens: number;
      totalRequests: number;
      totalDuration: number;
      totalSize: number;
    }>);

    return {
      totalEvents: events.length,
      period: { since: sinceTimestamp, until: Date.now() },
      byEventType: stats,
    };
  },
});

// Meter management functions
export const syncMeters = mutation({
  args: {
    meters: v.array(v.object({
      polarId: v.string(),
      name: v.string(),
      slug: v.string(),
      eventName: v.string(),
      valueProperty: v.string(),
      filters: v.optional(v.array(v.object({
        property: v.string(),
        operator: v.union(v.literal("eq"), v.literal("ne"), v.literal("gt"), v.literal("gte"), v.literal("lt"), v.literal("lte")),
        value: v.union(v.string(), v.number()),
      }))),
      organizationId: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const meter of args.meters) {
      const existing = await ctx.db
        .query("meters")
        .withIndex("by_polar_id", q => q.eq("polarId", meter.polarId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...meter,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("meters", {
          ...meter,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

export const getMeters = query({
  handler: async (ctx) => {
    return await ctx.db.query("meters").collect();
  },
}); 