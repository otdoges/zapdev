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

// Get all messages for a specific chat (only if owned by authenticated user)
export const getChatMessages = query({
  args: { 
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // First verify the user has access to this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_created")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .order("asc")
      .collect();
    
    return messages;
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
    
    const now = Date.now();
    
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      userId: identity.subject,
      content: args.content,
      role: args.role,
      metadata: args.metadata,
      createdAt: now,
    });
    
    // Update the chat's updatedAt timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
    });
    
    return messageId;
  },
});

// Update a message (only if user owns the chat)
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
    
    await ctx.db.patch(args.messageId, {
      content: args.content,
      metadata: args.metadata,
    });
    
    // Update the chat's updatedAt timestamp
    await ctx.db.patch(message.chatId, {
      updatedAt: Date.now(),
    });
    
    return args.messageId;
  },
});

// Delete a message (only if user owns the chat)
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
    
    await ctx.db.delete(args.messageId);
    
    // Update the chat's updatedAt timestamp
    await ctx.db.patch(message.chatId, {
      updatedAt: Date.now(),
    });
    
    return args.messageId;
  },
});

// Get latest messages across all user's chats (for overview)
export const getLatestMessages = query({
  args: { 
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const limit = args.limit || 50;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .order("desc")
      .take(limit);
    
    return messages;
  },
}); 