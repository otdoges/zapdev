import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  // Users table to store user information synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
    // Stripe fields
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripeSubscriptionStatus: v.optional(v.string()),
    stripeCurrentPeriodEnd: v.optional(v.number()),
    stripePriceId: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  // Chats table to store chat information
  chats: defineTable({
    userId: v.id("users"), // Reference to users table
    title: v.string(),
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  }).index("by_user", ["userId"]),

  // Messages table to store chat messages
  messages: defineTable({
    chatId: v.id("chats"), // Reference to chats table
    content: v.string(),
    role: v.string(), // "user" or "assistant"
    createdAt: v.number(), // Unix timestamp
  }).index("by_chat", ["chatId"]),
  
  // Auth example messages table
  authMessages: defineTable({
    content: v.string(),
    author: v.string(), // Store the tokenIdentifier from auth
    authorName: v.optional(v.string()),
    authorEmail: v.optional(v.string()),
    createdAt: v.number(), // Unix timestamp
  }).index("by_author", ["author"]),
}); 