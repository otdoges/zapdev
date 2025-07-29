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

// Get all chats for the authenticated user
export const getUserChats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getAuthenticatedUser(ctx);
    
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user_updated")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .order("desc")
      .collect();
    
    return chats;
  },
});

// Get a specific chat by ID (only if owned by authenticated user)
export const getChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
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
    const now = Date.now();
    
    const chatId = await ctx.db.insert("chats", {
      userId: identity.subject,
      title: args.title,
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
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }
    
    await ctx.db.patch(args.chatId, {
      title: args.title,
      updatedAt: Date.now(),
    });
    
    return args.chatId;
  },
});

// Delete a chat and all its messages (only if owned by authenticated user)
export const deleteChat = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || chat.userId !== identity.subject) {
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
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }
    
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });
    
    return args.chatId;
  },
}); 