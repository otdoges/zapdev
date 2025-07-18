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

  // Polar Products - cached from Polar API
  products: defineTable({
    polarId: v.string(), // Polar product ID
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
    .index("by_organization", ["organizationId"])
    .index("by_active", ["isArchived"]),

  // Polar Prices - cached from Polar API
  prices: defineTable({
    polarId: v.string(), // Polar price ID
    productId: v.id("products"),
    polarProductId: v.string(), // Polar product ID
    amountType: v.union(v.literal("fixed"), v.literal("free"), v.literal("custom")),
    type: v.union(v.literal("one_time"), v.literal("recurring")),
    recurringInterval: v.optional(v.union(v.literal("month"), v.literal("year"))),
    priceAmount: v.optional(v.number()),
    priceCurrency: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_polar_id", ["polarId"])
    .index("by_product", ["productId"])
    .index("by_polar_product", ["polarProductId"]),

  // Polar Customers - cached from Polar API
  customers: defineTable({
    polarId: v.string(), // Polar customer ID
    userId: v.string(), // Internal user ID
    email: v.string(),
    name: v.optional(v.string()),
    externalId: v.optional(v.string()), // Our user ID in Polar
    organizationId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_polar_id", ["polarId"])
    .index("by_user_id", ["userId"])
    .index("by_external_id", ["externalId"])
    .index("by_organization", ["organizationId"]),

  // Polar Subscriptions - cached from Polar API
  subscriptions: defineTable({
    polarId: v.string(), // Polar subscription ID
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
    .index("by_customer", ["customerId"])
    .index("by_polar_customer", ["polarCustomerId"])
    .index("by_product", ["productId"])
    .index("by_status", ["status"]),

  // Usage Events for Polar billing
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
      // Allow additional properties
      additionalProperties: v.optional(v.any()),
    }),
    ingested: v.boolean(), // Whether sent to Polar
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_customer", ["customerId"])
    .index("by_event_name", ["eventName"])
    .index("by_ingested", ["ingested"])
    .index("by_timestamp", ["timestamp"]),

  // Polar Meters - cached from Polar API
  meters: defineTable({
    polarId: v.string(), // Polar meter ID
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
    .index("by_polar_id", ["polarId"])
    .index("by_slug", ["slug"])
    .index("by_event_name", ["eventName"])
    .index("by_organization", ["organizationId"]),

  // User subscription status cache
  userSubscriptions: defineTable({
    userId: v.string(),
    subscriptionId: v.id("subscriptions"),
    isActive: v.boolean(),
    planName: v.string(),
    planType: v.union(v.literal("free"), v.literal("starter"), v.literal("professional"), v.literal("enterprise")),
    features: v.array(v.string()),
    usageLimits: v.object({
      monthlyAiRequests: v.optional(v.number()),
      monthlyTokens: v.optional(v.number()),
      maxChats: v.optional(v.number()),
      maxProjects: v.optional(v.number()),
    }),
    currentUsage: v.object({
      aiRequests: v.number(),
      tokensUsed: v.number(),
      chatsCreated: v.number(),
      projectsCreated: v.number(),
    }),
    resetDate: v.number(), // When usage resets (monthly)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_active", ["isActive"])
    .index("by_plan_type", ["planType"]),
}); 