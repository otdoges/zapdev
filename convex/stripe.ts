import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get Stripe customer ID for a Clerk user
export const getStripeCustomerId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const customer = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
    
    return customer?.stripeCustomerId || null;
  },
});

// Create or update Stripe customer mapping
export const setStripeCustomer = mutation({
  args: {
    clerkUserId: v.string(),
    stripeCustomerId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { clerkUserId, stripeCustomerId, email, name }) => {
    const existing = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing customer
      await ctx.db.patch(existing._id, {
        stripeCustomerId,
        email,
        name,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new customer mapping
      return await ctx.db.insert("stripeCustomers", {
        clerkUserId,
        stripeCustomerId,
        email,
        name,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get subscription data for a Stripe customer
export const getSubscriptionData = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    const subscription = await ctx.db
      .query("stripeSubscriptions")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", stripeCustomerId))
      .first();
    
    if (!subscription) {
      return { status: "none" };
    }

    return {
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
      priceId: subscription.priceId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      paymentMethod: subscription.paymentMethod,
      planName: subscription.planName,
    };
  },
});

// Get subscription data by Clerk user ID
export const getSubscriptionByClerkUserId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    // First get the Stripe customer
    const customer = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
    
    if (!customer) {
      return { status: "none" };
    }

    // Then get the subscription
    const subscription = await ctx.db
      .query("stripeSubscriptions")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", customer.stripeCustomerId))
      .first();
    
    if (!subscription) {
      return { status: "none" };
    }

    return {
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
      priceId: subscription.priceId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      paymentMethod: subscription.paymentMethod,
      planName: subscription.planName,
    };
  },
});

// Store/update subscription data
export const setSubscriptionData = mutation({
  args: {
    stripeCustomerId: v.string(),
    subscriptionId: v.string(),
    priceId: v.string(),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    paymentMethod: v.optional(v.object({
      brand: v.string(),
      last4: v.string(),
    })),
    planName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeSubscriptions")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    const now = Date.now();
    const subscriptionData = {
      stripeCustomerId: args.stripeCustomerId,
      subscriptionId: args.subscriptionId,
      priceId: args.priceId,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      paymentMethod: args.paymentMethod,
      planName: args.planName,
      updatedAt: now,
    };

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, subscriptionData);
      return existing._id;
    } else {
      // Create new subscription
      return await ctx.db.insert("stripeSubscriptions", {
        ...subscriptionData,
        createdAt: now,
      });
    }
  },
});

// Delete subscription data (when subscription is canceled/deleted)
export const deleteSubscriptionData = mutation({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    const subscription = await ctx.db
      .query("stripeSubscriptions")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", stripeCustomerId))
      .first();
    
    if (subscription) {
      await ctx.db.delete(subscription._id);
    }
  },
});

// Get all active subscriptions (for admin/analytics)
export const getAllActiveSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stripeSubscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// Get customer info by Stripe customer ID
export const getCustomerByStripeId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    return await ctx.db
      .query("stripeCustomers")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", stripeCustomerId))
      .first();
  },
});

// === PRICING DATA FUNCTIONS ===

// Sync Stripe product data to Convex
export const syncStripeProduct = mutation({
  args: {
    stripeProductId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    metadata: v.optional(v.object({
      tier: v.optional(v.string()),
      features: v.optional(v.string()),
      popular: v.optional(v.string()),
      order: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeProducts")
      .withIndex("by_stripe_product_id", (q) => q.eq("stripeProductId", args.stripeProductId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing product
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new product
      return await ctx.db.insert("stripeProducts", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Sync Stripe price data to Convex
export const syncStripePrice = mutation({
  args: {
    stripePriceId: v.string(),
    stripeProductId: v.string(),
    active: v.boolean(),
    currency: v.string(),
    recurring: v.optional(v.object({
      interval: v.string(),
      intervalCount: v.number(),
    })),
    type: v.string(),
    unitAmount: v.optional(v.number()),
    metadata: v.optional(v.object({
      tier: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripePrices")
      .withIndex("by_stripe_price_id", (q) => q.eq("stripePriceId", args.stripePriceId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing price
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new price
      return await ctx.db.insert("stripePrices", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get all active pricing data for display
export const getPricingData = query({
  args: {},
  handler: async (ctx) => {
    // Get all active products with their prices
    const products = await ctx.db
      .query("stripeProducts")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const pricingData = await Promise.all(
      products.map(async (product) => {
        const prices = await ctx.db
          .query("stripePrices")
          .withIndex("by_stripe_product_id", (q) => q.eq("stripeProductId", product.stripeProductId))
          .filter((q) => q.eq(q.field("active"), true))
          .collect();

        // Parse features from metadata
        let features: string[] = [];
        if (product.metadata?.features) {
          try {
            features = JSON.parse(product.metadata.features);
          } catch (e) {
            features = [];
          }
        }

        // Find the primary price (monthly if available)
        const monthlyPrice = prices.find(p => p.recurring?.interval === "month");
        const primaryPrice = monthlyPrice || prices[0];

        return {
          id: product.stripeProductId,
          name: product.name,
          description: product.description,
          features,
          tier: product.metadata?.tier || product.name.toLowerCase(),
          isPopular: product.metadata?.popular === "true",
          order: parseInt(product.metadata?.order || "0"),
          prices: prices.map(price => ({
            id: price.stripePriceId,
            amount: price.unitAmount,
            currency: price.currency,
            type: price.type,
            recurring: price.recurring,
          })),
          primaryPrice: primaryPrice ? {
            id: primaryPrice.stripePriceId,
            amount: primaryPrice.unitAmount,
            currency: primaryPrice.currency,
            type: primaryPrice.type,
            recurring: primaryPrice.recurring,
          } : null,
        };
      })
    );

    // Sort by order
    return pricingData.sort((a, b) => a.order - b.order);
  },
});

// Get pricing data for a specific tier
export const getPricingForTier = query({
  args: { tier: v.string() },
  handler: async (ctx, { tier }) => {
    const product = await ctx.db
      .query("stripeProducts")
      .filter((q) => 
        q.and(
          q.eq(q.field("active"), true),
          q.eq(q.field("metadata.tier"), tier)
        )
      )
      .first();

    if (!product) return null;

    const prices = await ctx.db
      .query("stripePrices")
      .withIndex("by_stripe_product_id", (q) => q.eq("stripeProductId", product.stripeProductId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    return {
      product,
      prices,
    };
  },
}); 