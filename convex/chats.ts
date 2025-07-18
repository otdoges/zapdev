import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all chats for a user
export const getUserChats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user_updated")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
    
    return chats;
  },
});

// Get a specific chat by ID
export const getChat = query({
  args: { chatId: v.id("chats"), userId: v.string() },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || chat.userId !== args.userId) {
      throw new Error("Chat not found or access denied");
    }
    
    return chat;
  },
});

// Create a new chat
export const createChat = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const chatId = await ctx.db.insert("chats", {
      userId: args.userId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
    
    return chatId;
  },
});

// Update chat title
export const updateChat = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || chat.userId !== args.userId) {
      throw new Error("Chat not found or access denied");
    }
    
    await ctx.db.patch(args.chatId, {
      title: args.title,
      updatedAt: Date.now(),
    });
    
    return args.chatId;
  },
});

// Delete a chat and all its messages
export const deleteChat = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || chat.userId !== args.userId) {
      throw new Error("Chat not found or access denied");
    }
    
    // Delete all messages in this chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
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
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || chat.userId !== args.userId) {
      throw new Error("Chat not found or access denied");
    }
    
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });
    
    return args.chatId;
  },
}); 