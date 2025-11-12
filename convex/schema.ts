import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Enum type definitions using unions of literals
export const frameworkEnum = v.union(
  v.literal("NEXTJS"),
  v.literal("ANGULAR"),
  v.literal("REACT"),
  v.literal("VUE"),
  v.literal("SVELTE")
);

export const messageRoleEnum = v.union(
  v.literal("USER"),
  v.literal("ASSISTANT")
);

export const messageTypeEnum = v.union(
  v.literal("RESULT"),
  v.literal("ERROR"),
  v.literal("STREAMING")
);

export const messageStatusEnum = v.union(
  v.literal("PENDING"),
  v.literal("STREAMING"),
  v.literal("COMPLETE")
);

export const attachmentTypeEnum = v.union(
  v.literal("IMAGE"),
  v.literal("FIGMA_FILE"),
  v.literal("GITHUB_REPO")
);

export const importSourceEnum = v.union(
  v.literal("FIGMA"),
  v.literal("GITHUB")
);

export const oauthProviderEnum = v.union(
  v.literal("figma"),
  v.literal("github")
);

export const importStatusEnum = v.union(
  v.literal("PENDING"),
  v.literal("PROCESSING"),
  v.literal("COMPLETE"),
  v.literal("FAILED")
);

export default defineSchema({
  // Users table - Better Auth
  users: defineTable({
    email: v.string(),
    emailVerified: v.optional(v.boolean()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    // Polar.sh subscription fields
    polarCustomerId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()), // active, canceled, past_due, etc.
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_polarCustomerId", ["polarCustomerId"]),

  // Sessions table - Better Auth
  sessions: defineTable({
    userId: v.id("users"),
    expiresAt: v.number(),
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_token", ["token"]),

  // Email Verifications table - for email verification flow
  emailVerifications: defineTable({
    userId: v.id("users"),
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    verified: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  // Accounts table - OAuth providers
  accounts: defineTable({
    userId: v.id("users"),
    provider: v.string(), // google, github, etc.
    providerAccountId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    tokenType: v.optional(v.string()),
    scope: v.optional(v.string()),
    idToken: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_provider_accountId", ["provider", "providerAccountId"]),

  // Projects table
  projects: defineTable({
    name: v.string(),
    userId: v.id("users"), // References users table
    framework: frameworkEnum,
    modelPreference: v.optional(v.string()), // User's preferred AI model (e.g., "auto", "anthropic/claude-haiku-4.5", "openai/gpt-4o")
    createdAt: v.optional(v.number()), // timestamp
    updatedAt: v.optional(v.number()), // timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  // Messages table
  messages: defineTable({
    content: v.string(),
    role: messageRoleEnum,
    type: messageTypeEnum,
    status: messageStatusEnum,
    projectId: v.id("projects"),
    createdAt: v.optional(v.number()), // timestamp
    updatedAt: v.optional(v.number()), // timestamp
  })
    .index("by_projectId", ["projectId"])
    .index("by_projectId_createdAt", ["projectId", "createdAt"]),

  // Fragments table - generated code artifacts
  fragments: defineTable({
    messageId: v.id("messages"),
    sandboxId: v.optional(v.string()),
    sandboxUrl: v.string(),
    title: v.string(),
    files: v.any(), // JSON data for file structure
    metadata: v.optional(v.any()), // Optional JSON metadata
    framework: frameworkEnum,
    createdAt: v.optional(v.number()), // timestamp
    updatedAt: v.optional(v.number()), // timestamp
  })
    .index("by_messageId", ["messageId"]),

  // FragmentDrafts table - work-in-progress fragments
  fragmentDrafts: defineTable({
    projectId: v.id("projects"),
    sandboxId: v.optional(v.string()),
    sandboxUrl: v.optional(v.string()),
    files: v.any(), // JSON data for draft files
    framework: frameworkEnum,
    createdAt: v.optional(v.number()), // timestamp
    updatedAt: v.optional(v.number()), // timestamp
  })
    .index("by_projectId", ["projectId"]),

  // Attachments table
  attachments: defineTable({
    type: attachmentTypeEnum,
    url: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    size: v.number(),
    messageId: v.id("messages"),
    importId: v.optional(v.id("imports")), // Link to import record
    sourceMetadata: v.optional(v.any()), // Figma/GitHub specific data
    createdAt: v.optional(v.number()), // timestamp
    updatedAt: v.optional(v.number()), // timestamp
  })
    .index("by_messageId", ["messageId"]),

  // OAuth Connections table - for storing encrypted OAuth tokens
  oauthConnections: defineTable({
    userId: v.id("users"), // References users table
    provider: oauthProviderEnum,
    accessToken: v.string(), // Encrypted token
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    scope: v.string(),
    metadata: v.optional(v.any()), // Provider-specific data (user info, etc)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_provider", ["userId", "provider"]),

  // Imports table - tracking import history and status
  imports: defineTable({
    userId: v.id("users"), // References users table
    projectId: v.id("projects"),
    messageId: v.optional(v.id("messages")),
    source: importSourceEnum,
    sourceId: v.string(), // Figma file key or GitHub repo ID
    sourceName: v.string(), // Display name
    sourceUrl: v.string(), // Original URL to Figma/GitHub
    status: importStatusEnum,
    metadata: v.optional(v.any()), // Import-specific data
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_projectId", ["projectId"])
    .index("by_status", ["status"]),

  // Usage table - rate limiting and credit tracking
  usage: defineTable({
    userId: v.id("users"), // References users table
    points: v.number(), // Remaining credits
    expire: v.optional(v.number()), // Expiration timestamp
    planType: v.optional(v.union(v.literal("free"), v.literal("pro"))), // Track plan type
  })
    .index("by_userId", ["userId"])
    .index("by_expire", ["expire"]),

  // Webhook Events table - for idempotency and tracking
  webhookEvents: defineTable({
    provider: v.string(), // e.g., "polar", "stripe"
    eventId: v.string(), // Provider's unique event ID
    eventType: v.string(), // e.g., "subscription.created", "payment.succeeded"
    payload: v.any(), // Raw webhook payload
    processed: v.boolean(), // Whether event has been processed
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()), // Error message if processing failed
    retryCount: v.number(), // Number of retry attempts
    lastRetry: v.optional(v.number()), // Timestamp of last retry
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_provider_eventId", ["provider", "eventId"])
    .index("by_provider_status", ["provider", "status"])
    .index("by_createdAt", ["createdAt"]),
});
