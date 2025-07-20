import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();
    
    return user;
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    return user;
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    return user;
  },
});

// Create or update user from Clerk profile
export const createOrUpdateUserFromClerk = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated");
    }

    const now = Date.now();
    const userId = identity.subject;
    const email = identity.email || '';
    const fullName = identity.name || undefined;
    const avatarUrl = identity.pictureUrl || undefined;
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: email,
        fullName: fullName,
        avatarUrl: avatarUrl,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userDocId = await ctx.db.insert("users", {
        userId: userId,
        email: email,
        fullName: fullName,
        avatarUrl: avatarUrl,
        username: email.split("@")[0],
        bio: "",
        createdAt: now,
        updatedAt: now,
      });

      // Create default user preferences
      await ctx.db.insert("userPreferences", {
        userId: userId,
        theme: "system",
        settings: {
          notifications: true,
          autoSave: true,
          fontSize: "medium",
        },
        createdAt: now,
        updatedAt: now,
      });

      return userDocId;
    }
  },
});

// Create a new user
export const createUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const userId = await ctx.db.insert("users", {
      userId: args.userId,
      email: args.email,
      fullName: args.fullName,
      avatarUrl: args.avatarUrl,
      username: args.username || args.email.split("@")[0],
      bio: args.bio || "",
      createdAt: now,
      updatedAt: now,
    });

    // Create default user preferences
    await ctx.db.insert("userPreferences", {
      userId: args.userId,
      theme: "system",
      settings: {
        notifications: true,
        autoSave: true,
        fontSize: "medium",
      },
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    userId: v.string(),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.fullName !== undefined) updateData.fullName = args.fullName;
    if (args.avatarUrl !== undefined) updateData.avatarUrl = args.avatarUrl;
    if (args.username !== undefined) updateData.username = args.username;
    if (args.bio !== undefined) updateData.bio = args.bio;

    await ctx.db.patch(user._id, updateData);
    
    return user._id;
  },
});

// Delete user
export const deleteUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.delete(user._id);
    return user._id;
  },
}); 