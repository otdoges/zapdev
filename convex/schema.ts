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

  // User profiles for JWT authentication examples
  userProfiles: defineTable({
    userId: v.string(), // Reference to authenticated user ID
    email: v.string(),
    displayName: v.string(),
    bio: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  // Chat conversations
  chats: defineTable({
    userId: v.string(), // Reference to the user who owns this chat
    title: v.string(),
    screenshot: v.optional(v.string()), // Base64 screenshot or URL of the generated project
    sandboxId: v.optional(v.string()), // Associated sandbox ID for this chat
    sandboxUrl: v.optional(v.string()), // URL of the deployed sandbox
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
    // Backward compatibility: previously named contentChecksum on some clients
    contentChecksum: v.optional(v.string()),
    
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      cost: v.optional(v.number()),
      diagramData: v.optional(v.object({
        type: v.union(v.literal("mermaid"), v.literal("flowchart"), v.literal("sequence"), v.literal("gantt")),
        diagramText: v.string(),
        isApproved: v.optional(v.boolean()),
        userFeedback: v.optional(v.string()),
        version: v.number(),
      })),
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
      aiBackgroundAgent: v.optional(v.object({
        enabled: v.boolean(),
        mode: v.union(v.literal("manual"), v.literal("auto"), v.literal("scheduled")),
        triggers: v.optional(v.array(v.string())), // Conditions that trigger AI agent
        restrictions: v.optional(v.array(v.string())), // What AI should not do
      })),
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

  // Stripe customer mapping - stores the relationship between app users and Stripe customers
  stripeCustomers: defineTable({
    userId: v.string(), // Our app's user ID (from Clerk)
    stripeCustomerId: v.string(), // Stripe's customer ID
    email: v.string(), // Customer email for validation
    metadata: v.optional(v.object({
      createdViaCheckout: v.optional(v.boolean()),
      originalPlanId: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"])
    .index("by_email", ["email"]),

  // Enhanced subscription cache - complete Stripe subscription state
  stripeSubscriptionCache: defineTable({
    userId: v.string(),
    stripeCustomerId: v.string(),
    subscriptionId: v.optional(v.string()),
    status: v.union(
      v.literal("incomplete"),
      v.literal("incomplete_expired"), 
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("paused"),
      v.literal("none")
    ),
    priceId: v.optional(v.string()),
    planId: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    currentPeriodStart: v.optional(v.number()), // seconds since epoch
    currentPeriodEnd: v.optional(v.number()),   // seconds since epoch
    cancelAtPeriodEnd: v.boolean(),
    paymentMethod: v.optional(v.object({
      brand: v.optional(v.string()),
      last4: v.optional(v.string()),
    })),
    // Metadata for debugging and tracking
    lastSyncAt: v.number(),
    syncSource: v.union(v.literal("webhook"), v.literal("success"), v.literal("manual")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"])
    .index("by_subscription_id", ["subscriptionId"])
    .index("by_plan_id", ["planId"])
    .index("by_status", ["status"]),
    
  aiRateLimits: defineTable({
  /**
   * AI Rate Limiting Schema
   *
   * This table implements rate limiting for AI operations using time-windowed tracking.
   * Each record represents usage within a specific time window for a user-operation pair.
   *
   * Key Format: ai_rate_{userId}_{operation}
   * Window Strategy: [Specify sliding/fixed window approach]
   * Cleanup Policy: [Specify how old records are removed]
   */
    key: v.string(), // Composite key: ai_rate_{userId}_{operation}
    userId: v.string(),
    operation: v.string(),
    requestCount: v.number(),
    totalCost: v.number(),
    windowStart: v.number(),
    lastRequest: v.number(),
    tokens: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_user", ["userId"])
    .index("by_window", ["windowStart"])
    .index("by_user_operation", ["userId", "operation"])
    .index("by_user_window", ["userId", "windowStart"]),

  // Secret access management for protected features
  secretAccess: defineTable({
    userId: v.string(), // User who has access to secret features
    hasAccess: v.boolean(), // Whether user has access to secret chat
    passwordHash: v.optional(v.string()), // Hashed password for secret access (only for first user setup)
    isFirstUser: v.boolean(), // Whether this user is the one who set the password
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_access", ["hasAccess"]),

  // User API keys for external services (encrypted storage)
  userApiKeys: defineTable({
    userId: v.string(), // User who owns this API key
    provider: v.string(), // Service provider (e.g., "gemini", "openai")
    encryptedApiKey: v.string(), // Encrypted API key using user-specific encryption
    keyHash: v.string(), // SHA-256 hash of the API key for verification
    isActive: v.boolean(), // Whether this key is currently active
    lastUsed: v.optional(v.number()), // Timestamp of last usage
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_provider", ["userId", "provider"])
    .index("by_active", ["isActive"]),

  // Secret chat conversations (separate from regular chats)
  secretChats: defineTable({
    userId: v.string(), // User who owns this secret chat
    title: v.string(),
    provider: v.string(), // AI provider used (e.g., "gemini")
    model: v.string(), // Specific model used (e.g., "gemini-2.0-flash-exp")
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  // Secret chat messages
  secretMessages: defineTable({
    chatId: v.id("secretChats"), // Reference to secret chat
    userId: v.string(), // User who created this message
    content: v.string(), // Message content
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

  // Deployed sites tracking - Free tier: max 10 sites per user
  deployedSites: defineTable({
    userId: v.string(), // User who owns this deployed site
    siteId: v.string(), // Unique identifier for the site
    name: v.string(), // User-friendly name for the site
    url: v.string(), // Live site URL (e.g., myapp.vercel.app)
    customDomain: v.optional(v.string()), // Custom domain (Pro feature only)
    vercelDeploymentId: v.optional(v.string()), // Vercel deployment ID
    status: v.union(v.literal("building"), v.literal("ready"), v.literal("error"), v.literal("queued")),
    sandboxId: v.optional(v.string()), // Associated E2B sandbox
    chatId: v.optional(v.id("chats")), // Associated chat conversation
    projectFiles: v.optional(v.string()), // JSON string of deployed files
    buildLogs: v.optional(v.string()), // Deployment build logs
    errorMessage: v.optional(v.string()), // Error details if deployment failed
    environmentVars: v.optional(v.string()), // JSON string of env vars
    framework: v.optional(v.string()), // Framework used (Next.js, React, etc.)
    nodeVersion: v.optional(v.string()), // Node.js version used
    lastDeployedAt: v.number(), // Timestamp of last deployment
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_site_id", ["siteId"])
    .index("by_sandbox_id", ["sandboxId"])
    .index("by_chat_id", ["chatId"])
    .index("by_created", ["createdAt"]),

  // Website analytics data for deployed sites
  siteAnalytics: defineTable({
    siteId: v.string(), // Reference to deployed site
    userId: v.string(), // Site owner (for quick filtering)
    event: v.string(), // Event type: pageview, click, scroll, etc.
    page: v.string(), // Page path (e.g., "/", "/about")
    title: v.optional(v.string()), // Page title
    referrer: v.optional(v.string()), // Referrer URL
    userAgent: v.optional(v.string()), // Browser user agent
    ip: v.optional(v.string()), // Visitor IP (hashed for privacy)
    country: v.optional(v.string()), // Visitor country
    city: v.optional(v.string()), // Visitor city
    device: v.optional(v.string()), // Device type: desktop, mobile, tablet
    browser: v.optional(v.string()), // Browser name
    os: v.optional(v.string()), // Operating system
    sessionId: v.optional(v.string()), // Session identifier
    loadTime: v.optional(v.number()), // Page load time in ms
    scrollDepth: v.optional(v.number()), // Max scroll depth as percentage
    timestamp: v.number(), // When the event occurred
  })
    .index("by_site_id", ["siteId"])
    .index("by_user_id", ["userId"])
    .index("by_site_timestamp", ["siteId", "timestamp"])
    .index("by_site_event", ["siteId", "event"])
    .index("by_timestamp", ["timestamp"])
    .index("by_page", ["siteId", "page"]),

  // Codebase download tracking
  downloads: defineTable({
    userId: v.string(), // User who initiated the download
    projectName: v.string(), // Name of the downloaded project
    downloadType: v.union(v.literal("zip"), v.literal("github")), // Download method
    sandboxId: v.optional(v.string()), // Associated E2B sandbox
    chatId: v.optional(v.id("chats")), // Associated chat
    fileSize: v.number(), // Size of download in bytes
    fileCount: v.number(), // Number of files included
    fileName: v.string(), // Generated file name
    downloadUrl: v.optional(v.string()), // Temporary download URL
    githubRepo: v.optional(v.string()), // GitHub repository URL if applicable
    includeDatabase: v.boolean(), // Whether database files were included
    includeEnv: v.boolean(), // Whether .env template was included
    status: v.union(v.literal("generating"), v.literal("ready"), v.literal("error"), v.literal("expired")),
    errorMessage: v.optional(v.string()), // Error details if generation failed
    expiresAt: v.optional(v.number()), // When download link expires
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_sandbox_id", ["sandboxId"])
    .index("by_chat_id", ["chatId"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  // AI-generated databases for projects
  aiDatabases: defineTable({
    userId: v.string(), // User who owns this database
    sandboxId: v.string(), // E2B sandbox this database belongs to
    chatId: v.optional(v.id("chats")), // Associated chat conversation
    name: v.string(), // Database name (user-friendly)
    description: v.string(), // AI-generated description of the database purpose
    schema: v.string(), // Generated Drizzle schema code
    dbType: v.union(v.literal("sqlite"), v.literal("postgres"), v.literal("mysql")), // Database type
    tables: v.array(v.string()), // Array of table names
    relationships: v.optional(v.string()), // JSON string describing table relationships
    sampleData: v.optional(v.string()), // Generated sample data (JSON)
    migrationScript: v.optional(v.string()), // Database migration script
    seedScript: v.optional(v.string()), // Data seeding script
    studioUrl: v.optional(v.string()), // Drizzle Studio access URL
    isActive: v.boolean(), // Whether this database is currently active in sandbox
    generatedBy: v.string(), // AI model used for generation
    generationPrompt: v.optional(v.string()), // Original user prompt
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_sandbox_id", ["sandboxId"])
    .index("by_chat_id", ["chatId"])
    .index("by_user_sandbox", ["userId", "sandboxId"])
    .index("by_active", ["isActive"])
    .index("by_db_type", ["dbType"]),

  // Database table schemas generated by AI (for detailed tracking)
  aiDatabaseTables: defineTable({
    databaseId: v.id("aiDatabases"), // Reference to parent database
    tableName: v.string(), // Table name
    schema: v.string(), // Individual table schema definition
    description: v.string(), // Purpose of this table
    columns: v.array(v.object({
      name: v.string(),
      type: v.string(),
      nullable: v.boolean(),
      defaultValue: v.optional(v.string()),
      isPrimaryKey: v.boolean(),
      isForeignKey: v.boolean(),
      references: v.optional(v.string()), // Referenced table.column
    })),
    indexes: v.optional(v.array(v.string())), // Index definitions
    relationships: v.optional(v.array(v.object({
      type: v.union(v.literal("one-to-one"), v.literal("one-to-many"), v.literal("many-to-many")),
      relatedTable: v.string(),
      foreignKey: v.string(),
    }))),
    sampleRowCount: v.number(), // Number of sample rows generated
    createdAt: v.number(),
  })
    .index("by_database_id", ["databaseId"])
    .index("by_table_name", ["tableName"]),
});