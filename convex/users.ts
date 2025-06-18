import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

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

// Get user by string ID (for Better Auth integration)
export const getUserByStringId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Try to find user by iterating through all users
    // This is a fallback for string-based IDs from Better Auth
    const users = await ctx.db.query("users").collect();
    return users.find(user => user._id.toString() === args.userId) || null;
  },
});

// Create or update user from OAuth provider
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
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name,
        avatar,
        provider,
        lastLogin: now,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        email,
        name,
        avatar,
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

// Create chat with string user ID (for Better Auth integration)
export const createChatWithStringUserId = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, title } = args;
    
    // Look up the user to get the proper Convex ID
    let userRecord = null;
    
    // First try to get user directly if it's a valid Convex ID
    try {
      const convexId = userId as any; // Cast to Convex ID type
      userRecord = await ctx.db.get(convexId);
    } catch (error) {
      // Not a valid Convex ID, try other lookup methods
      const users = await ctx.db.query("users").collect();
      userRecord = users.find(user => user._id.toString() === userId) || null;
    }
    
    if (!userRecord) {
      throw new Error("User not found");
    }
    
    const now = Date.now();
    
    return await ctx.db.insert("chats", {
      userId: userRecord._id,
      title,
      createdAt: now,
      updatedAt: now,
    });
  },
});
