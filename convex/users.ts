import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./helpers";

// Get user profile or create if not exists
export const getProfile = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = args.userId || (await requireAuth(ctx));
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return user;
  },
});

// Update or create user preference
export const setPreferredMode = mutation({
  args: {
    mode: v.union(v.literal("web"), v.literal("background")),
    quizAnswers: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const now = Date.now();

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        preferredMode: args.mode,
        quizAnswers: args.quizAnswers,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      const newUserId = await ctx.db.insert("users", {
        userId,
        preferredMode: args.mode,
        quizAnswers: args.quizAnswers,
        backgroundAgentEnabled: false, // Default to false as per requirements (feature gated)
        createdAt: now,
        updatedAt: now,
      });
      return newUserId;
    }
  },
});
