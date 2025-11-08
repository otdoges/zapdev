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

export const issuePriorityEnum = v.union(
  v.literal("CRITICAL"),
  v.literal("HIGH"),
  v.literal("MEDIUM"),
  v.literal("LOW")
);

export const issueCategoryEnum = v.union(
  v.literal("BUG"),
  v.literal("FEATURE"),
  v.literal("ENHANCEMENT"),
  v.literal("CHORE"),
  v.literal("DOCUMENTATION")
);

export const issueComplexityEnum = v.union(
  v.literal("XS"),
  v.literal("S"),
  v.literal("M"),
  v.literal("L"),
  v.literal("XL")
);

export const issueWorkflowStatusEnum = v.union(
  v.literal("UNTRIAGED"),
  v.literal("TRIAGED"),
  v.literal("ASSIGNED"),
  v.literal("IN_PROGRESS"),
  v.literal("BLOCKED"),
  v.literal("COMPLETED")
);

export const taskTypeEnum = v.union(
  v.literal("TRIAGE"),
  v.literal("CODEGEN"),
  v.literal("PR_CREATION")
);

export const taskStatusEnum = v.union(
  v.literal("PENDING"),
  v.literal("PROCESSING"),
  v.literal("COMPLETED"),
  v.literal("FAILED"),
  v.literal("CANCELLED")
);

export const pullRequestStatusEnum = v.union(
  v.literal("DRAFT"),
  v.literal("OPEN"),
  v.literal("MERGED"),
  v.literal("CLOSED")
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

  githubIssues: defineTable({
    repoFullName: v.string(),
    issueNumber: v.number(),
    githubIssueId: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    title: v.string(),
    body: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    priority: v.optional(issuePriorityEnum),
    category: v.optional(issueCategoryEnum),
    complexity: v.optional(issueComplexityEnum),
    status: v.optional(issueWorkflowStatusEnum),
    estimateHours: v.optional(v.number()),
    assignedAgent: v.optional(v.string()),
    triageSummary: v.optional(v.string()),
    triageMetadata: v.optional(v.any()),
    projectId: v.optional(v.id("projects")),
    syncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_repo_issue", ["repoFullName", "issueNumber"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_project", ["projectId"]),

  tasks: defineTable({
    type: taskTypeEnum,
    status: taskStatusEnum,
    issueId: v.optional(v.id("githubIssues")),
    payload: v.optional(v.any()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    priority: v.optional(v.number()),
    attempts: v.number(),
    maxAttempts: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_issue", ["issueId"])
    .index("by_type_status", ["type", "status"]),

  pullRequests: defineTable({
    issueId: v.optional(v.id("githubIssues")),
    repoFullName: v.string(),
    branchName: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    prNumber: v.optional(v.number()),
    prUrl: v.optional(v.string()),
    status: pullRequestStatusEnum,
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_repo", ["repoFullName"])
    .index("by_status", ["status"]),
});
