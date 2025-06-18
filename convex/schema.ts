import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  // Users table to store user information from OAuth providers
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatar: v.string(),
    provider: v.string(), // "github", "google", etc.
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
    lastLogin: v.number(), // Unix timestamp
    // Stripe fields (optional for future billing)
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripeSubscriptionStatus: v.optional(v.string()),
    stripeCurrentPeriodEnd: v.optional(v.number()),
    stripePriceId: v.optional(v.string()),
  })
  .index("by_email", ["email"])
  .index("by_provider", ["provider"])
  .index("by_stripe_customer_id", ["stripeCustomerId"])
  .index("by_stripe_subscription_id", ["stripeSubscriptionId"]),

  // Chats table to store chat information
  chats: defineTable({
    userId: v.id("users"), // Reference to users table
    title: v.string(),
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  }).index("by_user_id", ["userId"]),

  // Messages table to store chat messages
  messages: defineTable({
    chatId: v.id("chats"), // Reference to chats table
    content: v.string(),
    role: v.string(), // "user" or "assistant"
    createdAt: v.number(), // Unix timestamp
  }).index("by_chat_id", ["chatId"]),
  
  // Auth example messages table
  authMessages: defineTable({
    content: v.string(),
    author: v.string(), // Store the tokenIdentifier from auth
    authorName: v.optional(v.string()),
    authorEmail: v.optional(v.string()),
    createdAt: v.number(), // Unix timestamp
  }).index("by_author", ["author"]),
}); 