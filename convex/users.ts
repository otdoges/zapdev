import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get user by ID
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Create or update user from OAuth provider or email signup
export const createOrUpdateUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    avatar: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, name, avatar, provider } = args;

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user, but don't overwrite avatar if the new one is empty and existing one exists
      const updateData: Partial<{
        name: string;
        avatar: string;
        provider: string;
        lastLogin: number;
        updatedAt: number;
      }> = {
         name,
         lastLogin: now,
         updatedAt: now,
      };
      
      // Update provider if the new one is more specific than the existing one
      const shouldUpdateProvider = 
        !existingUser.provider || 
        existingUser.provider === "oauth" || 
        existingUser.provider === "email" ||
        (provider !== "oauth" && provider !== "email");
      
      if (shouldUpdateProvider) {
        updateData.provider = provider;
      }
      
      // Update avatar if new one is provided or existing one is empty
      if (avatar || !existingUser.avatar) {
        updateData.avatar = avatar;
      }
      
      await ctx.db.patch(existingUser._id, updateData);
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        email,
        name,
        avatar: avatar || "", // Ensure avatar is never undefined
        provider,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
      });
    }
  },
});

// Get all users (admin function)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(userId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

// Delete user
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.delete(args.userId);
    return { success: true };
  },
});

// Get user stats
export const getUserStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get user's chat count
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get total message count
    let totalMessages = 0;
    for (const chat of chats) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_id", (q) => q.eq("chatId", chat._id))
        .collect();
      totalMessages += messages.length;
    }

    return {
      user,
      chatCount: chats.length,
      messageCount: totalMessages,
      joinedAt: user.createdAt,
      lastActive: user.lastLogin,
    };
  },
});
