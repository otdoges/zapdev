import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's secret chats
export const getSecretChats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chats = await ctx.db
      .query("secretChats")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return chats;
  },
});

// Get a specific secret chat with messages
export const getSecretChat = query({
  args: {
    chatId: v.id("secretChats"),
  },
  handler: async (ctx, { chatId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    const messages = await ctx.db
      .query("secretMessages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", chatId))
      .order("asc")
      .collect();

    return {
      ...chat,
      messages,
    };
  },
});

// Create a new secret chat
export const createSecretChat = mutation({
  args: {
    title: v.string(),
    provider: v.string(),
    model: v.string(),
  },
  handler: async (ctx, { title, provider, model }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chatId = await ctx.db.insert("secretChats", {
      userId,
      title,
      provider,
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return chatId;
  },
});

// Add a message to secret chat
export const addSecretMessage = mutation({
  args: {
    chatId: v.id("secretChats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      cost: v.optional(v.number()),
    })),
  },
  handler: async (ctx, { chatId, content, role, metadata }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the chat
    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    const messageId = await ctx.db.insert("secretMessages", {
      chatId,
      userId,
      content,
      role,
      metadata,
      createdAt: Date.now(),
    });

    // Update chat's updatedAt timestamp
    await ctx.db.patch(chatId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Update secret chat title
export const updateSecretChatTitle = mutation({
  args: {
    chatId: v.id("secretChats"),
    title: v.string(),
  },
  handler: async (ctx, { chatId, title }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    await ctx.db.patch(chatId, {
      title,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete secret chat
export const deleteSecretChat = mutation({
  args: {
    chatId: v.id("secretChats"),
  },
  handler: async (ctx, { chatId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    // Delete all messages in the chat
    const messages = await ctx.db
      .query("secretMessages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat
    await ctx.db.delete(chatId);

    return { success: true };
  },
});