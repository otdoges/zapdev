import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get messages for a chat
export const getChatMessages = query({
  args: { chatId: v.id("chats"), userId: v.string() },
  handler: async (ctx, args) => {
    // First verify the user owns this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== args.userId) {
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

// Get a specific message
export const getMessage = query({
  args: { messageId: v.id("messages"), userId: v.string() },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify the user owns the chat this message belongs to
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    return message;
  },
});

// Create a new message
export const createMessage = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.string(),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      cost: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Verify the user owns this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== args.userId) {
      throw new Error("Chat not found or access denied");
    }

    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      userId: args.userId,
      content: args.content,
      role: args.role,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    // Update the chat's updatedAt timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });
    
    return messageId;
  },
});

// Update a message (typically for editing user messages)
export const updateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify the user owns the chat this message belongs to
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== args.userId) {
      throw new Error("Access denied");
    }

    // Only allow editing user messages
    if (message.role !== "user") {
      throw new Error("Can only edit user messages");
    }
    
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
    
    return args.messageId;
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify the user owns the chat this message belongs to
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    await ctx.db.delete(args.messageId);
    
    return args.messageId;
  },
});

// Get recent messages for a user across all chats (for search/history)
export const getRecentMessages = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);
    
    return messages;
  },
}); 