import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get authenticated user
import { QueryCtx, MutationCtx } from "./_generated/server";

const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User must be authenticated");
  }
  return identity;
};

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getAuthenticatedUser(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();
    
    return user;
  },
});

// Create or update user profile
export const upsertUser = mutation({
  args: {
    email: v.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        fullName: args.fullName,
        avatarUrl: args.avatarUrl,
        username: args.username,
        bio: args.bio,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        userId: identity.subject,
        email: args.email,
        fullName: args.fullName,
        avatarUrl: args.avatarUrl,
        username: args.username,
        bio: args.bio,
        createdAt: now,
        updatedAt: now,
      });
      return userId;
    }
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    settings: v.optional(v.object({
      notifications: v.optional(v.boolean()),
      autoSave: v.optional(v.boolean()),
      fontSize: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Check if preferences already exist
    const existingPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (existingPrefs) {
      // Update existing preferences
      await ctx.db.patch(existingPrefs._id, {
        theme: args.theme,
        settings: args.settings,
        updatedAt: now,
      });
      return existingPrefs._id;
    } else {
      // Create new preferences
      const prefsId = await ctx.db.insert("userPreferences", {
        userId: identity.subject,
        theme: args.theme,
        settings: args.settings,
        createdAt: now,
        updatedAt: now,
      });
      return prefsId;
    }
  },
});

// Get user preferences
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getAuthenticatedUser(ctx);

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();
    
    return preferences;
  },
}); 