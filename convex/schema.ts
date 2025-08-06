import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Encryption Validation Rules (Applied at Application Level)
 * 
 * These rules should be enforced in Convex mutation functions:
 * 
 * 1. Consistency Validation:
 *    - If isEncrypted === true, then encryptedContent, encryptionSalt, encryptionIv, and contentSha256 MUST be present
 *    - If isEncrypted === false/undefined, then encryption fields MUST be null/undefined
 * 
 * 2. Format Validation:
 *    - encryptionSalt: Must be valid base64, decode to 16+ bytes (128+ bits entropy)
 *    - encryptionIv: Must be valid base64, decode to exactly 12 bytes (96 bits for AES-GCM)
 *    - encryptedContent: Must be valid base64 AES-GCM ciphertext
 *    - contentSha256: Must be valid hex string, exactly 64 characters (32 bytes)
 * 
 * 3. Security Validation:
 *    - encryptionSalt must be cryptographically random and unique per message
 *    - encryptionIv must be cryptographically random and unique per message
 *    - No salt/IV pair should ever be reused across messages
 * 
 * 4. Size Limits:
 *    - encryptedContent: Max 200KB encoded (prevents DoS attacks)
 *    - Original content: Max 100KB before encryption
 * 
 * Implementation: Use these rules in messages.ts mutation functions
 */

export default defineSchema({
  // Users table - stores user profile information
  users: defineTable({
    // Use the auth user ID from Clerk auth
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
    content: v.string(), // Plaintext content (for backward compatibility)
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    
    /**
     * End-to-End Encryption Schema
     * 
     * This schema supports hybrid storage where messages can be either plaintext (legacy)
     * or encrypted using AES-GCM encryption with PBKDF2 key derivation.
     * 
     * Encryption Flow:
     * 1. Generate unique cryptographically random salt (32 bytes, base64 encoded)
     * 2. Generate unique initialization vector/nonce (12 bytes for AES-GCM, base64 encoded)
     * 3. Derive encryption key from user passphrase + salt using PBKDF2 (100,000+ iterations)
     * 4. Encrypt content using AES-GCM with derived key and IV
     * 5. Calculate SHA-256 hash of original plaintext for integrity verification
     * 6. Store all components separately for security
     * 
     * Security Properties:
     * - Each message uses unique salt/IV pair to prevent rainbow table attacks
     * - AES-GCM provides both confidentiality and authenticity
     * - SHA-256 hash enables integrity verification of decrypted content
     * - Key derivation uses high iteration count to slow brute force attacks
     * - Salt and IV are stored separately to minimize attack surface
     */
    
    // Encryption control flag - when true, encryptedContent MUST be present
    isEncrypted: v.optional(v.boolean()),
    
    // AES-GCM encrypted message content (base64 encoded)
    // REQUIRED when isEncrypted is true, contains the actual encrypted message
    encryptedContent: v.optional(v.string()),
    
    // Cryptographically random salt for PBKDF2 key derivation (32 bytes, base64)
    // MUST be unique per message to prevent rainbow table attacks
    // Generated using crypto.getRandomValues() or equivalent secure RNG
    encryptionSalt: v.optional(v.string()),
    
    // Initialization vector/nonce for AES-GCM encryption (12 bytes, base64)
    // MUST be unique per message and never reused with the same key
    // Generated using crypto.getRandomValues() for each encryption operation
    encryptionIv: v.optional(v.string()),
    
    // SHA-256 hash of the original plaintext content (hex encoded)
    // Used for integrity verification after decryption to detect tampering
    // Calculated before encryption: SHA-256(original_plaintext)
    contentSha256: v.optional(v.string()),
    
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

  // Usage Events for billing with Clerk
  usageEvents: defineTable({
    eventName: v.string(),
    userId: v.string(),
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
    ingested: v.boolean(), // Whether processed for billing
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_event_name", ["eventName"])
    .index("by_ingested", ["ingested"])
    .index("by_timestamp", ["timestamp"]),

  // User subscription status (managed by Clerk billing)
  userSubscriptions: defineTable({
    userId: v.string(),
    planId: v.string(), // Clerk plan ID
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
    currentUsage: v.object({
      conversationsUsed: v.number(),
      codeExecutionsUsed: v.number(),
    }),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    resetDate: v.number(), // When usage resets (monthly)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_plan_type", ["planType"])
    .index("by_status", ["status"]),
});