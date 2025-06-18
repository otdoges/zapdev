import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Get all chats for a user
export const getChatsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get a specific chat by ID
export const getChatById = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

// Get messages for a chat
export const getMessagesByChatId = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

// Create a new chat
export const createChat = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, title } = args;
    const now = Date.now();
    
    return await ctx.db.insert("chats", {
      userId,
      title,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a chat
export const updateChat = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { chatId, title } = args;
    const now = Date.now();
    
    return await ctx.db.patch(chatId, {
      title,
      updatedAt: now,
    });
  },
});

// Delete a chat and its messages
export const deleteChat = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const { chatId } = args;
    
    // Get all messages for this chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", chatId))
      .collect();
    
    // Delete all messages
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Delete the chat
    return await ctx.db.delete(chatId);
  },
});

// Add a message to a chat
export const addMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const { chatId, content, role } = args;
    const now = Date.now();
    
    return await ctx.db.insert("messages", {
      chatId,
      content,
      role,
      createdAt: now,
    });
  },
});

// Create a new chat with string user ID (for Better Auth integration)
export const createChatWithStringUserId = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, title } = args;
    
    // Find the user by string ID
    const users = await ctx.db.query("users").collect();
    const user = users.find(u => u._id.toString() === userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = Date.now();
    
    return await ctx.db.insert("chats", {
      userId: user._id,
      title,
      createdAt: now,
      updatedAt: now,
    });
  },
}); 