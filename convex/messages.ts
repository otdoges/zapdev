import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { enforceRateLimit } from "./rateLimit";
import { enforceAIRateLimit } from "./aiRateLimit";
import DOMPurify from 'dompurify';

// Security utility functions
const generateSecureToken = async (length: number): Promise<string> => {
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    throw new Error('Secure random number generation is not available in this context');
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const sanitizeHTML = (input: string): string => {
  // Use DOMPurify for robust XSS protection
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SANITIZE_DOM: true,
  });
};

const sanitizeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

// Helper function to get authenticated user
const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User must be authenticated");
  }
  return identity;
};

// Input sanitization helpers
const sanitizeContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    throw new Error("Content is required and must be a string");
  }
  
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Content cannot be empty");
  }
  
  if (trimmed.length > 50000) { // 50KB limit
    throw new Error("Content too long (max 50,000 characters)");
  }
  
  return trimmed;
};

const sanitizeMetadata = (metadata: unknown) => {
  if (!metadata) return undefined;
  
  const meta = metadata as { 
    model?: unknown; 
    tokens?: unknown; 
    cost?: unknown;
    diagramData?: unknown;
  };
  const sanitized: { 
    model?: string; 
    tokens?: number; 
    cost?: number;
    diagramData?: {
      type: "mermaid" | "flowchart" | "sequence" | "gantt";
      diagramText: string;
      isApproved?: boolean;
      userFeedback?: string;
      version: number;
    };
  } = {};

  if (typeof meta.model === 'string') {
    sanitized.model = meta.model.trim().substring(0, 100);
  }

  if (typeof meta.tokens === 'number' && meta.tokens >= 0) {
    sanitized.tokens = Math.floor(meta.tokens);
  }

  if (typeof meta.cost === 'number' && meta.cost >= 0) {
    sanitized.cost = Math.round(meta.cost * 100) / 100; // Round to 2 decimal places
  }

  // Sanitize diagram data
  if (meta.diagramData && typeof meta.diagramData === 'object') {
    const diagramData = meta.diagramData as any;
    const validTypes = ['mermaid', 'flowchart', 'sequence', 'gantt'];
    
    if (validTypes.includes(diagramData.type) && 
        typeof diagramData.diagramText === 'string' &&
        typeof diagramData.version === 'number') {
      
      sanitized.diagramData = {
        type: diagramData.type,
        diagramText: diagramData.diagramText.substring(0, 10000), // Limit diagram text size
        version: Math.floor(diagramData.version),
      };

      if (typeof diagramData.isApproved === 'boolean') {
        sanitized.diagramData.isApproved = diagramData.isApproved;
      }

      if (typeof diagramData.userFeedback === 'string') {
        sanitized.diagramData.userFeedback = diagramData.userFeedback.trim().substring(0, 1000);
      }
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

// Rate limiting helper
const checkRateLimit = async (ctx: QueryCtx | MutationCtx, userId: string, action: string) => {
  const oneMinuteAgo = Date.now() - 60000;
  const recentMessages = await ctx.db
    .query("messages")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .filter((q) => q.gt(q.field("createdAt"), oneMinuteAgo))
    .collect();

  if (action === "create" && recentMessages.length >= 30) {
    throw new Error("Rate limit exceeded: Too many messages created recently (max 30 per minute)");
  }
  
  if (action === "update") {
    // For updates, check recent updates within the last 5 seconds
    const fiveSecondsAgo = Date.now() - 5000;
    const recentUpdates = recentMessages.filter(msg => 
      msg.createdAt > fiveSecondsAgo && msg.role === 'user'
    );
    
    if (recentUpdates.length >= 1) {
      throw new Error("Rate limit exceeded: Please wait 5 seconds between message updates");
    }
  }
};

// Encryption validation helper
const validateEncryptionData = (args: {
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptionSalt?: string;
  encryptionIv?: string;
  contentSha256?: string;
  // Backward compatibility: accept deprecated client field name
  contentChecksum?: string;
}) => {
  if (!args.isEncrypted) {
    return; // No validation needed for non-encrypted messages
  }

  // Check for required encryption fields
  const checksum = args.contentSha256 || args.contentChecksum;
  if (!args.encryptedContent || !args.encryptionSalt || !args.encryptionIv || !checksum) {
    throw new Error("Missing required encryption fields for encrypted message");
  }
  
  // Validate encrypted content length (reasonable limits)
  if (args.encryptedContent.length > 200000) { // ~150KB base64 encoded limit
    throw new Error("Encrypted content too large");
  }
  
  // Basic validation of base64 encoding
  try {
    atob(args.encryptedContent);
    atob(args.encryptionSalt);
    atob(args.encryptionIv);
  } catch (error) {
    throw new Error("Invalid base64 encoding in encryption fields");
  }
};

// Get all messages for a specific chat (only if owned by authenticated user)
export const getChatMessages = query({
  args: { 
    chatId: v.id("chats"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // Use createdAt timestamp as cursor for pagination
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Validate limit
    const limit = Math.min(args.limit || 100, 500); // Max 500 messages at once
    
    // First verify the user has access to this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }
    
    // Build the base query on the compound index (chatId, createdAt)
    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", args.chatId));


    // Add cursor-based pagination if provided
    if (args.cursor) {
      messagesQuery = messagesQuery.filter((q) =>
        q.gt(q.field("createdAt"), args.cursor!)
      );
    }

    const messages = await messagesQuery
      .order("asc")
      .take(limit);

    // The next cursor should point to the last message's createdAt timestamp
    const continueCursor = messages.length === limit ? messages[messages.length - 1].createdAt : null;

    return {
      messages,
      continueCursor,
    };
  },
});

// Get a specific message by ID (only if user owns the chat)
export const getMessage = query({
  args: { 
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }
    
    // Verify user has access to the chat this message belongs to
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    return message;
  },
});

// Create a new message (only if user owns the chat)
export const createMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    
    // Encryption support
    isEncrypted: v.optional(v.boolean()),
    encryptedContent: v.optional(v.string()),
    encryptionSalt: v.optional(v.string()),
    encryptionIv: v.optional(v.string()),
    contentSha256: v.optional(v.string()),
    // Backward compatibility: accept deprecated client field name
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
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);

    // Verify user has access to this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }

    // Simple message limit check (can be enhanced with proper subscription logic later)
    if (args.role === "user") {
      // For now, allow all messages (remove this limitation or implement proper Stripe subscription check)
      // This can be enhanced later with proper subscription status checking
    }

    // Rate limiting
    await enforceRateLimit(ctx, "sendMessage");
    
    // AI-specific rate limiting for assistant messages
    if (args.role === "assistant") {
      // Get user's subscription tier from database
      const user = await ctx.db
        .query("users")
        .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
        .first();
      
      const subscription = user ? await ctx.db
        .query("userSubscriptions")
        .withIndex("by_user_id", (q) => q.eq("userId", user.userId))
        .first() : null;
      
      const tier = subscription?.planType || "free";
      const estimatedCost = args.metadata?.cost || 0.01; // Default to 1 cent if no cost provided
      
      await enforceAIRateLimit(ctx, identity.subject, "ai_message", {
        estimatedCost,
        tier,
        tokens: args.metadata?.tokens,
      });
    }
    
    // Input validation and sanitization
    const sanitizedContent = sanitizeContent(args.content);
    const sanitizedMetadata = sanitizeMetadata(args.metadata);
    
    // Validate encryption data if provided
    validateEncryptionData(args);
    
    // Additional validation for role-based restrictions
    if (args.role === "system" && identity.subject !== chat.userId) {
      throw new Error("Only chat owners can create system messages");
    }
    
    const now = Date.now();
    
    // Build message data with conditional encryption fields
    const messageData: {
      chatId: Id<"chats">;
      userId: string;
      content: string;
      role: "user" | "assistant" | "system";
      metadata?: { 
        model?: string; 
        tokens?: number; 
        cost?: number;
        diagramData?: {
          type: "mermaid" | "flowchart" | "sequence" | "gantt";
          diagramText: string;
          isApproved?: boolean;
          userFeedback?: string;
          version: number;
        };
      };
      createdAt: number;
      isEncrypted?: boolean;
      encryptedContent?: string;
      encryptionSalt?: string;
      encryptionIv?: string;
      contentSha256?: string;
    } = {
      chatId: args.chatId,
      userId: identity.subject,
      content: sanitizedContent,
      role: args.role,
      metadata: sanitizedMetadata,
      createdAt: now,
    };
    
    // Add encryption fields if message is encrypted
    if (args.isEncrypted) {
      messageData.isEncrypted = true;
      messageData.encryptedContent = args.encryptedContent;
      messageData.encryptionSalt = args.encryptionSalt;
      messageData.encryptionIv = args.encryptionIv;
      // Support old client field name `contentChecksum`
      messageData.contentSha256 = args.contentSha256 || (args as unknown as { contentChecksum?: string }).contentChecksum;
    }
    
    const messageId = await ctx.db.insert("messages", messageData);

    // Usage tracking can be implemented here if needed
    if (args.role === "user") {
      // This could track usage in your analytics system
    }
    
    // Update the chat's updatedAt timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
    });
    
    return messageId;
  },
});

// Update a message (only if user owns the chat and message)
export const updateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    
    // Encryption support for updates
    isEncrypted: v.optional(v.boolean()),
    encryptedContent: v.optional(v.string()),
    encryptionSalt: v.optional(v.string()),
    encryptionIv: v.optional(v.string()),
    contentSha256: v.optional(v.string()),
    // Backward compatibility: accept deprecated client field name
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
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }
    
    // Verify user has access to the chat this message belongs to
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    // Additional check: user can only edit their own messages
    if (message.userId !== identity.subject) {
      throw new Error("You can only edit your own messages");
    }
    
    // Rate limiting
    await checkRateLimit(ctx, identity.subject, "update");
    
    // Input validation and sanitization
    const sanitizedContent = sanitizeContent(args.content);
    const sanitizedMetadata = sanitizeMetadata(args.metadata);
    
    // Validate encryption data if provided
    validateEncryptionData(args);
    
    // Prevent editing messages older than 24 hours (configurable business rule)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (message.createdAt < twentyFourHoursAgo) {
      throw new Error("Cannot edit messages older than 24 hours");
    }
    
    // Build update data with conditional encryption fields
    const updateData: {
      content: string;
      metadata?: { 
        model?: string; 
        tokens?: number; 
        cost?: number;
        diagramData?: {
          type: "mermaid" | "flowchart" | "sequence" | "gantt";
          diagramText: string;
          isApproved?: boolean;
          userFeedback?: string;
          version: number;
        };
      };
      isEncrypted?: boolean;
      encryptedContent?: string;
      encryptionSalt?: string;
      encryptionIv?: string;
      contentSha256?: string;
    } = {
      content: sanitizedContent,
      metadata: sanitizedMetadata,
    };
    
    // Add or remove encryption fields based on isEncrypted flag
    if (args.isEncrypted) {
      updateData.isEncrypted = true;
      updateData.encryptedContent = args.encryptedContent;
      updateData.encryptionSalt = args.encryptionSalt;
      updateData.encryptionIv = args.encryptionIv;
      // Support old client field name `contentChecksum`
      updateData.contentSha256 = args.contentSha256 || (args as unknown as { contentChecksum?: string }).contentChecksum;
    } else {
      // If switching from encrypted to unencrypted, clear encryption fields
      updateData.isEncrypted = false;
      updateData.encryptedContent = undefined;
      updateData.encryptionSalt = undefined;
      updateData.encryptionIv = undefined;
      updateData.contentSha256 = undefined;
    }
    
    await ctx.db.patch(args.messageId, updateData);
    
    // Update the chat's updatedAt timestamp
    await ctx.db.patch(message.chatId, {
      updatedAt: Date.now(),
    });
    
    return args.messageId;
  },
});

// Delete a message (only if user owns the chat and message)
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }
    
    // Verify user has access to the chat this message belongs to
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    // Additional check: user can only delete their own messages
    if (message.userId !== identity.subject) {
      throw new Error("You can only delete your own messages");
    }
    
    // Prevent deleting messages older than 24 hours (configurable business rule)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (message.createdAt < twentyFourHoursAgo) {
      throw new Error("Cannot delete messages older than 24 hours");
    }
    
    await ctx.db.delete(args.messageId);
    
    // Update the chat's updatedAt timestamp
    await ctx.db.patch(message.chatId, {
      updatedAt: Date.now(),
    });
    
    return args.messageId;
  },
});

// Get latest messages across all user's chats (for overview) - Secured
export const getLatestMessages = query({
  args: { 
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Validate and limit the query size
    const limit = Math.min(args.limit || 50, 200); // Max 200 messages
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);
    
    return messages;
  },
});

// Get message count for a chat
export const getChatMessageCount = query({
  args: { 
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Verify user has access to this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .collect();
    
    return messages.length;
  },
});

// Search messages in user's chats
export const searchMessages = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    chatId: v.optional(v.id("chats")), // Optional: search within specific chat
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Validate search term
    const searchTerm = args.searchTerm.trim();
    if (searchTerm.length < 2) {
      throw new Error("Search term must be at least 2 characters long");
    }
    
    if (searchTerm.length > 100) {
      throw new Error("Search term too long (max 100 characters)");
    }
    
    const limit = Math.min(args.limit || 50, 100);
    
    let messages;
    
    if (args.chatId) {
      // Search within specific chat
      const chat = await ctx.db.get(args.chatId);
      if (!chat || chat.userId !== identity.subject) {
        throw new Error("Chat not found or access denied");
      }
      
      messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_created", (q) => q.eq("chatId", args.chatId!))
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), identity.subject),
            // Simple text search - in production, consider using a proper search index
            q.or(
              q.gte(q.field("content"), searchTerm),
              q.lte(q.field("content"), searchTerm + "\uffff")
            )
          )
        )
        .take(limit);
    } else {
      // Search across all user's messages
      messages = await ctx.db
        .query("messages")
        .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
        .filter((q) => 
          // Simple text search - in production, consider using a proper search index
          q.or(
            q.gte(q.field("content"), searchTerm),
            q.lte(q.field("content"), searchTerm + "\uffff")
          )
        )
        .take(limit);
    }
    
    return messages;
  },
});

// Bulk delete messages (for cleanup)
export const bulkDeleteMessages = mutation({
  args: {
    messageIds: v.array(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Limit bulk operations
    if (args.messageIds.length > 50) {
      throw new Error("Cannot delete more than 50 messages at once");
    }
    
    const deletedIds = [];
    const chatIds = new Set<Id<"chats">>();
    
    for (const messageId of args.messageIds) {
      const message = await ctx.db.get(messageId);
      
      if (!message) {
        continue; // Skip non-existent messages
      }
      
      // Verify user has access to the chat this message belongs to
      const chat = await ctx.db.get(message.chatId);
      if (!chat || chat.userId !== identity.subject) {
        throw new Error(`Access denied for message ${messageId}`);
      }
      
      // Additional check: user can only delete their own messages
      if (message.userId !== identity.subject) {
        throw new Error(`You can only delete your own messages (${messageId})`);
      }
      
      await ctx.db.delete(messageId);
      deletedIds.push(messageId);
      chatIds.add(message.chatId);
    }
    
    // Update all affected chats' timestamps
    const now = Date.now();
    for (const chatId of chatIds) {
      await ctx.db.patch(chatId, {
        updatedAt: now,
      });
    }
    
    return { deletedCount: deletedIds.length, deletedIds };
  },
});

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Content Security Policy (CSP) configuration
 */
export const getCSPConfig = (nonce?: string) => {
  const config: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Use nonce for inline scripts in production
      nonce ? `'nonce-${nonce}'` : "'unsafe-inline'",
      "https://cdn.jsdelivr.net", // For trusted CDNs
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Often needed for CSS-in-JS
      "https://fonts.googleapis.com",
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "blob:",
    ],
    'connect-src': [
      "'self'",
      // Add your API endpoints here
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  // Add development-specific sources
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    config['script-src'].push("'unsafe-eval'"); // For HMR
    config['connect-src'].push("ws://localhost:*", "http://localhost:*");
  }

  return config;
};

/**
 * Generate CSP header string
 */
export const generateCSPHeader = (nonce?: string): string => {
  const config = getCSPConfig(nonce);
  
  return Object.entries(config)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Security headers for production
 */
export const getSecurityHeaders = (nonce?: string): Record<string, string> => {
  return {
    'Content-Security-Policy': generateCSPHeader(nonce),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0', // Disabled in modern browsers, CSP is better
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
};

/**
 * File upload validation
 */
export const validateFileUpload = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
    ],
    allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.txt', '.csv', '.json'
    ]
  } = options;

  // Check file size
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File size exceeds ${sizeMB}MB limit` };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'File extension not allowed' };
  }
  const doubleExtPattern = /(\.[^.\s]{2,}){2,}$/i;
  if (doubleExtPattern.test(file.name.toLowerCase())) {
    return { valid: false, error: 'Suspicious file name detected' };
  }

  return { valid: true };
};

/**
 * Browser storage utilities (not encrypted, but with JSON handling)
 */
export const browserStorage = {
  set: (key: string, value: unknown, expiryMs?: number): boolean => {
    try {
      const data = {
        value,
        expiry: expiryMs ? Date.now() + expiryMs : null,
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },

  get: <T = unknown>(key: string): T | null => {
    try {
      if (typeof localStorage === 'undefined') return null;
      
      const item = localStorage.getItem(key);
      if (!item) return null;

      const data = JSON.parse(item);
      
      // Check expiry
      if (data.expiry && Date.now() > data.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return data.value as T;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },

  remove: (key: string): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },

  clear: (): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  },
};

/**
 * Session storage wrapper with same interface
 */
export const sessionStorage = {
  set: (key: string, value: unknown): boolean => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      console.error('Session storage error:', error);
      return false;
    }
  },

  get: <T = unknown>(key: string): T | null => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return null;
      
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) as T : null;
    } catch (error) {
      console.error('Session storage error:', error);
      return null;
    }
  },

  remove: (key: string): void => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
    }
  },

  clear: (): void => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  },
};

/**
 * CSRF Token management
 */
export const csrf = {
  generate: async (): Promise<string> => {
    return generateSecureToken(32);
  },

  store: (token: string): void => {
    sessionStorage.set('csrf_token', token);
  },
  get: (): string | null => {
    return sessionStorage.get<string>('csrf_token');
  },
  validate: (token: string): boolean => {
    const stored = csrf.get();
    return !!stored && stored === token;
  },


};

/**
 * Trusted types policy creation (for browsers that support it)
 */
export const createTrustedTypesPolicy = () => {
  if (typeof window !== 'undefined' && 'trustedTypes' in window) {
    try {
      const trustedTypes = (window as typeof window & {
        trustedTypes?: {
          createPolicy: (name: string, policy: {
            createHTML?: (input: string) => string;
            createScriptURL?: (input: string) => string;
          }) => unknown;
        };
      }).trustedTypes;
      
      if (trustedTypes) {
        return trustedTypes.createPolicy('default', {
          createHTML: (input: string) => sanitizeHTML(input),
          createScriptURL: (input: string) => {
            const url = sanitizeUrl(input);
            if (!url) throw new Error('Invalid URL');
            return url;
          },
        });
      }
    } catch (error) {
      console.warn('Trusted Types not available:', error);
    }
  }
  return null;
};

/**
 * Check if running in secure context (HTTPS)
 */
export const isSecureContext = (): boolean => {
  return typeof window !== 'undefined' && window.isSecureContext;
};

/**
 * Detect potential XSS in user input (for logging/monitoring)
 */
export const detectPotentialXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<embed/i,
    /<object/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Format and validate phone numbers
 */
export const validatePhoneNumber = (phone: string, countryCode: string = 'US'): boolean => {
  // Basic international phone validation
  const patterns: Record<string, RegExp> = {
    US: /^(\+1)?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    UK: /^(\+44)?[-.\s]?(\(0\))?[-.\s]?(7\d{3}|\d{2,4})[-.\s]?\d{3,4}[-.\s]?\d{3,4}$/,
    // Add more country patterns as needed
  };

  const pattern = patterns[countryCode] || /^[\d\s()+-]+$/;
  return pattern.test(phone.replace(/\s/g, ''));
};

/**
 * Sanitize JSON string to prevent injection
 */
export const sanitizeJSON = (jsonString: string): string | null => {
  try {
    const parsed = JSON.parse(jsonString);
    // Re-stringify to remove any potential code
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
};
export const timingSafeEqual = (a: string, b: string): boolean => {
  const minLength = Math.min(a.length, b.length);
  const maxLength = Math.max(a.length, b.length);

  let result = 0;
  // Compare up to max length, padding shorter string conceptually
  for (let i = 0; i < maxLength; i++) {
    const aChar = i < a.length ? a.charCodeAt(i) : 0;
    const bChar = i < b.length ? b.charCodeAt(i) : 0;
    result |= aChar ^ bChar;
  }
  
  // Also incorporate length difference
  result |= a.length ^ b.length;
  
  return result === 0;
};
