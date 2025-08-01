import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Helper function to get authenticated user
const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User must be authenticated");
  }
  return identity;
};

// Input sanitization helpers
const sanitizeTitle = (title: string): string => {
  if (!title || typeof title !== 'string') {
    throw new Error("Title is required and must be a string");
  }
  
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Title cannot be empty");
  }
  
  if (trimmed.length > 200) {
    throw new Error("Title too long (max 200 characters)");
  }

  // Escape HTML entities to prevent injection while preserving original characters
  const escapeHtmlEntities = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const sanitized = escapeHtmlEntities(trimmed);

  if (/^(&amp;|&lt;|&gt;|&quot;|&#39;|\s)*$/.test(sanitized)) {
    throw new Error("Title contains only invalid characters");
  }

  return sanitized;
};
const checkChatCreationRateLimit = async (ctx: QueryCtx | MutationCtx, userId: string) => {
  const oneMinuteAgo = Date.now() - 60000;
  const recentChats = await ctx.db
    .query("chats")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .filter((q) => q.gt(q.field("createdAt"), oneMinuteAgo))
    .take(11);

  if (recentChats.length >= 10) {
    throw new Error("Rate limit exceeded: Too many chats created recently (max 10 per minute)");
  }
};

const checkChatUpdateRateLimit = async (ctx: QueryCtx | MutationCtx, userId: string) => {
  const tenSecondsAgo = Date.now() - 10000;
  const recentChats = await ctx.db
    .query("chats")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .filter((q) => q.gt(q.field("updatedAt"), tenSecondsAgo))
    .collect();

  if (recentChats.length >= 20) {
    throw new Error("Rate limit exceeded: Too many chat updates recently (max 20 per 10 seconds)");
  }
};

// Get all chats for the authenticated user with efficient cursor-based pagination
export const getUserChats = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // Use updatedAt timestamp as cursor
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Validate pagination parameters
    const limit = Math.min(args.limit || 50, 200); // Max 200 chats at once
    
    let query = ctx.db
      .query("chats")
      .withIndex("by_user_updated", (q) => q.eq("userId", identity.subject));
    
    // Apply cursor-based pagination for efficient large dataset handling
    if (args.cursor) {
      query = query.filter((q) => q.lt(q.field("updatedAt"), args.cursor!));
    }
    
    const chats = await query
      .order("desc")
      .take(limit);
    
    return {
      chats,
      nextCursor: chats.length === limit ? chats[chats.length - 1].updatedAt : null,
      hasMore: chats.length === limit
    };
  },
});

// DEPRECATED: Legacy offset-based pagination - kept for backward compatibility
// WARNING: This method is inefficient for large offsets as it fetches limit + offset
// records and then discards the first 'offset' records. Use getUserChats instead.
export const getUserChatsOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Validate pagination parameters
    const limit = Math.min(args.limit || 50, 200); // Max 200 chats at once
    const offset = Math.max(args.offset || 0, 0);
    
    // WARNING: This offset-based approach becomes increasingly inefficient 
    // as offset grows large, as it needs to fetch and discard 'offset' records
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user_updated", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit + offset);
    
    // Apply offset manually since Convex doesn't have built-in offset
    return chats.slice(offset, offset + limit);
  },
});

// Get a specific chat by ID (only if owned by authenticated user)
export const getChat = query({
  args: { 
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat) {
      throw new Error("Chat not found");
    }
    
    if (chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    return chat;
  },
});

// Create a new chat for the authenticated user
export const createChat = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Rate limiting
    await checkChatCreationRateLimit(ctx, identity.subject);
    
    // Input validation and sanitization
    const sanitizedTitle = sanitizeTitle(args.title);
    
    // Check if user has too many chats (optional business rule)
    const userChats = await ctx.db
      .query("chats")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect();
    
    if (userChats.length >= 1000) { // Configurable limit
      throw new Error("Maximum number of chats reached (1000)");
    }
    
    const now = Date.now();
    
    const chatId = await ctx.db.insert("chats", {
      userId: identity.subject,
      title: sanitizedTitle,
      createdAt: now,
      updatedAt: now,
    });
    
    return chatId;
  },
});

// Update chat title (only if owned by authenticated user)
export const updateChat = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Rate limiting
    await checkChatUpdateRateLimit(ctx, identity.subject);
    
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat) {
      throw new Error("Chat not found");
    }
    
    if (chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    // Input validation and sanitization
    const sanitizedTitle = sanitizeTitle(args.title);
    
    // Prevent unnecessary updates
    if (chat.title === sanitizedTitle) {
      return args.chatId;
    }
    
    await ctx.db.patch(args.chatId, {
      title: sanitizedTitle,
      updatedAt: Date.now(),
    });
    
    return args.chatId;
  },
});

// Delete a chat and all its messages (only if owned by authenticated user)
export const deleteChat = mutation({
  args: {
    chatId: v.id("chats"),
    confirmTitle: v.optional(v.string()), // Optional confirmation for safety
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat) {
      throw new Error("Chat not found");
    }
    
    if (chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    // Optional title confirmation for important chats
    if (args.confirmTitle && chat.title !== args.confirmTitle.trim()) {
      throw new Error("Chat title confirmation does not match");
    }
    
    // Use proper index query instead of filter for better performance
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .collect();
    
    // Delete messages in batches to avoid timeout
    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      for (const message of batch) {
        await ctx.db.delete(message._id);
      }
    }
    
    // Delete the chat
    await ctx.db.delete(args.chatId);
    
    return args.chatId;
  },
});

// Update chat's updated timestamp (when new message is added)
export const touchChat = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat) {
      throw new Error("Chat not found");
    }
    
    if (chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    // Throttle touch updates to prevent excessive database writes
    const fiveSecondsAgo = Date.now() - 5000;
    if (chat.updatedAt > fiveSecondsAgo) {
      return args.chatId; // Skip update if recently touched
    }
    
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });
    
    return args.chatId;
  },
});

// Get chat statistics for user
export const getUserChatStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getAuthenticatedUser(ctx);
    
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect();
    
    const totalChats = chats.length;
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const recentChats = chats.filter(chat => chat.createdAt > oneWeekAgo).length;
    const monthlyChats = chats.filter(chat => chat.createdAt > oneMonthAgo).length;
    
    return {
      totalChats,
      recentChats,
      monthlyChats,
      oldestChat: chats.length > 0 ? Math.min(...chats.map(c => c.createdAt)) : null,
      newestChat: chats.length > 0 ? Math.max(...chats.map(c => c.createdAt)) : null,
    };
  },
});

// Search user's chats by title
export const searchChats = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
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

    const chats = await ctx.db
      .query("chats")
      .withSearchIndex("search_title", (q) =>
        q.search("title", searchTerm).eq("userId", identity.subject)
      )
      .take(limit);

    return chats;
  },
});

// Bulk delete multiple chats
export const bulkDeleteChats = mutation({
  args: {
    chatIds: v.array(v.id("chats")),
    confirmDelete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);

    if (!args.confirmDelete) {
      throw new Error("Bulk deletion requires confirmation");
    }

    if (args.chatIds.length > 50) {
      throw new Error("Cannot delete more than 50 chats at once");
    }

    if (args.chatIds.length === 0) {
      return { deletedCount: 0, deletedIds: [] };
    }

    const deletedIds: string[] = [];

    for (const chatId of args.chatIds) {
      const chat = await ctx.db.get(chatId);
      if (!chat) continue;
      if (chat.userId !== identity.subject) {
        throw new Error(`Access denied for chat ${chatId}`);
      }

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_id", (q) => q.eq("chatId", chatId))
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      await ctx.db.delete(chatId);
      deletedIds.push(chatId);
    }

    return { deletedCount: deletedIds.length, deletedIds };
  },
});

// Duplicate/copy a chat (without messages)
export const duplicateChat = mutation({
  args: {
    chatId: v.id("chats"),
    newTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Rate limiting
    await checkChatCreationRateLimit(ctx, identity.subject);
    
    const originalChat = await ctx.db.get(args.chatId);
    
    if (!originalChat) {
      throw new Error("Original chat not found");
    }
    
    if (originalChat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    // Determine new title
    const newTitle = args.newTitle 
      ? sanitizeTitle(args.newTitle)
      : `Copy of ${originalChat.title}`;
    
    const now = Date.now();
    
    const newChatId = await ctx.db.insert("chats", {
      userId: identity.subject,
      title: newTitle,
      createdAt: now,
      updatedAt: now,
    });
    
    return newChatId;
  },
});