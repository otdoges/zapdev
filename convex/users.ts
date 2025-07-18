import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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