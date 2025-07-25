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

  // Clerk Billing - user subscription plans managed by Clerk
  clerkSubscriptions: defineTable({
    clerkUserId: v.string(), // Clerk user ID
    planSlug: v.string(), // Plan identifier (starter, pro, enterprise)
    planName: v.string(), // Human-readable plan name
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("canceled")),
    features: v.array(v.string()), // Array of feature slugs user has access to
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_plan_slug", ["planSlug"])
    .index("by_status", ["status"]),

  // Chat conversations
  chats: defineTable({
    userId: v.string(), // Reference to the user who owns this chat
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

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

  // AI model configurations
  aiModels: defineTable({
    name: v.string(),
    provider: v.string(), // 'groq', 'openai', etc.
    modelId: v.string(), // actual model identifier
    description: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
    temperature: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_provider", ["provider"])
    .index("by_active", ["isActive"]),

  // User preferences
  userPreferences: defineTable({
    userId: v.string(),
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    defaultModelId: v.optional(v.id("aiModels")),
    settings: v.optional(v.object({
      notifications: v.optional(v.boolean()),
      autoSave: v.optional(v.boolean()),
      fontSize: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"]),

  // API usage tracking
  apiUsage: defineTable({
    userId: v.string(),
    modelId: v.id("aiModels"),
    tokensUsed: v.number(),
    costCents: v.optional(v.number()),
    requestType: v.string(), // 'chat', 'completion', etc.
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_date", ["userId", "createdAt"])
    .index("by_model", ["modelId"]),

  // Polar Products - products from Polar billing
  products: defineTable({
    polarId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("individual"), v.literal("business")),
    isRecurring: v.boolean(),
    isArchived: v.boolean(),
    organizationId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_polar_id", ["polarId"])
    .index("by_active", ["isArchived"]),

  // Polar Prices - pricing information for products
  prices: defineTable({
    polarId: v.string(),
    productId: v.id("products"),
    polarProductId: v.string(),
    amountType: v.union(v.literal("fixed"), v.literal("free"), v.literal("custom")),
    type: v.union(v.literal("one_time"), v.literal("recurring")),
    recurringInterval: v.optional(v.union(v.literal("month"), v.literal("year"))),
    priceAmount: v.optional(v.number()),
    priceCurrency: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_polar_id", ["polarId"])
    .index("by_product", ["productId"]),

  // Polar Customers - customer information from Polar
  customers: defineTable({
    polarId: v.string(),
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    externalId: v.optional(v.string()),
    organizationId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_polar_id", ["polarId"])
    .index("by_user_id", ["userId"]),

  // Polar Subscriptions - subscription information from Polar
  subscriptions: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_polar_id", ["polarId"])
    .index("by_customer", ["customerId"]),

  // Usage Events - track API/service usage for billing
  usageEvents: defineTable({
    eventName: v.string(),
    userId: v.string(),
    customerId: v.optional(v.id("customers")),
    polarCustomerId: v.optional(v.string()),
    externalCustomerId: v.optional(v.string()),
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
    ingested: v.boolean(),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_ingested", ["ingested"]),

  // Meters - billing meters configuration from Polar
  meters: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_polar_id", ["polarId"]),

}); 