import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { enforceRateLimit } from "./rateLimit";

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
  
  const meta = metadata as { model?: unknown; tokens?: unknown; cost?: unknown };
  const sanitized: { model?: string; tokens?: number; cost?: number } = {};

  if (typeof meta.model === 'string') {
    sanitized.model = meta.model.trim().substring(0, 100);
  }

  if (typeof meta.tokens === 'number' && meta.tokens >= 0) {
    sanitized.tokens = Math.floor(meta.tokens);
  }

  if (typeof meta.cost === 'number' && meta.cost >= 0) {
    sanitized.cost = Math.round(meta.cost * 100) / 100; // Round to 2 decimal places
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
    // Need to implement proper update tracking, possibly by:
    // 1. Adding an updatedAt field to messages
    // 2. Tracking updates in a separate table
    // 3. Using a different rate limiting strategy for updates
    throw new Error("Update rate limiting not properly implemented");
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

    // Apply cursor-based pagination: fetch messages created AFTER the provided cursor
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
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      cost: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);

    // Verify user has access to this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }
    
    // Rate limiting
    await enforceRateLimit(ctx, "sendMessage");
    
    // Input validation and sanitization
    const sanitizedContent = sanitizeContent(args.content);
    const sanitizedMetadata = sanitizeMetadata(args.metadata);
    
    // Additional validation for role-based restrictions
    if (args.role === "system" && identity.subject !== chat.userId) {
      throw new Error("Only chat owners can create system messages");
    }
    
    const now = Date.now();
    
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      userId: identity.subject,
      content: sanitizedContent,
      role: args.role,
      metadata: sanitizedMetadata,
      createdAt: now,
    });
    
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
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      cost: v.optional(v.number()),
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
    
    // Prevent editing messages older than 24 hours (configurable business rule)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (message.createdAt < twentyFourHoursAgo) {
      throw new Error("Cannot edit messages older than 24 hours");
    }
    
    await ctx.db.patch(args.messageId, {
      content: sanitizedContent,
      metadata: sanitizedMetadata,
    });
    
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