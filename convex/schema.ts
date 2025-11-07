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
  // Projects table
  projects: defineTable({
    name: v.string(),
    userId: v.string(), // Clerk user ID (not v.id - we'll store the Clerk ID directly)
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
    userId: v.string(), // Clerk user ID
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
    userId: v.string(), // Clerk user ID
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
    userId: v.string(), // Clerk user ID
    points: v.number(), // Remaining credits
    expire: v.optional(v.number()), // Expiration timestamp
    planType: v.optional(v.union(v.literal("free"), v.literal("pro"))), // Track plan type
  })
    .index("by_userId", ["userId"])
    .index("by_expire", ["expire"]),
});
