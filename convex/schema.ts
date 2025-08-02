import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores user profile information
  users: defineTable({
    // Use the auth user ID from WorkOS/Convex auth
    userId: v.string(), // This will be the authenticated user ID
    email: v.string(),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  // Chat conversations
  chats: defineTable({
    userId: v.string(), // Reference to the user who owns this chat
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId"],
    }),

  // Chat messages
  messages: defineTable({
    chatId: v.id("chats"), // Reference to the chat this message belongs to
    userId: v.string(), // User who created this message
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      cost: v.optional(v.number()),
    })),
    createdAt: v.number(),
  })
    .index("by_chat_id", ["chatId"])
    .index("by_chat_created", ["chatId", "createdAt"])
    .index("by_user_id", ["userId"]),

  // User preferences
  userPreferences: defineTable({
    userId: v.string(),
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    settings: v.optional(v.object({
      notifications: v.optional(v.boolean()),
      autoSave: v.optional(v.boolean()),
      fontSize: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"]),

  // Stripe Products - cached from Stripe API
  stripeProducts: defineTable({
    stripeId: v.string(), // Stripe product ID
    name: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stripe_id", ["stripeId"])
    .index("by_active", ["active"]),

  // Stripe Prices - cached from Stripe API
  stripePrices: defineTable({
    stripeId: v.string(), // Stripe price ID
    productId: v.id("stripeProducts"),
    stripeProductId: v.string(), // Stripe product ID
    type: v.union(v.literal("one_time"), v.literal("recurring")),
    recurringInterval: v.optional(v.union(v.literal("month"), v.literal("year"))),
    unitAmount: v.optional(v.number()), // Amount in cents
    currency: v.string(),
    active: v.boolean(),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stripe_id", ["stripeId"])
    .index("by_product", ["productId"])
    .index("by_stripe_product", ["stripeProductId"])
    .index("by_active", ["active"]),

  // Stripe Customers - cached from Stripe API
  stripeCustomers: defineTable({
    stripeId: v.string(), // Stripe customer ID
    userId: v.string(), // Internal user ID
    email: v.string(),
    name: v.optional(v.string()),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stripe_id", ["stripeId"])
    .index("by_user_id", ["userId"]),

  // Stripe Subscriptions - cached from Stripe API
  stripeSubscriptions: defineTable({
    stripeId: v.string(), // Stripe subscription ID
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stripe_id", ["stripeId"])
    .index("by_customer", ["customerId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_product", ["productId"])
    .index("by_status", ["status"]),



  // Usage Events for billing
  usageEvents: defineTable({
    eventName: v.string(),
    userId: v.string(),
    customerId: v.optional(v.string()), // Stripe customer ID
    metadata: v.object({
      requests: v.optional(v.number()),
      duration: v.optional(v.number()),
      size: v.optional(v.number()),
      // Allow additional properties
      additionalProperties: v.optional(v.any()),
    }),
    ingested: v.boolean(), // Whether sent to billing provider
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_customer", ["customerId"])
    .index("by_event_name", ["eventName"])
    .index("by_ingested", ["ingested"])
    .index("by_timestamp", ["timestamp"]),

  // User subscription status cache
  userSubscriptions: defineTable({
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
    resetDate: v.number(), // When usage resets (monthly)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_active", ["isActive"])
    .index("by_plan_type", ["planType"]),
}); 