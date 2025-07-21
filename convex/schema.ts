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

}); 