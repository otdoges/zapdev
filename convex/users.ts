import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./helpers";

// Get user profile or create if not exists
export const getProfile = query({
  args: { userId: v.optional(v.string()) },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      userId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      preferredMode: v.optional(v.union(v.literal("web"), v.literal("background"))),
      quizAnswers: v.optional(
        v.object({
          reason: v.optional(v.string()),
        })
      ),
      backgroundAgentEnabled: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
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
// SECURITY: Always uses authenticated userId - cannot modify other users' preferences
export const setPreferredMode = mutation({
  args: {
    mode: v.union(v.literal("web"), v.literal("background")),
    quizAnswers: v.optional(
      v.object({
        reason: v.optional(v.string()),
      })
    ),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // SECURITY FIX: Always derive userId from authentication context
    // This prevents users from modifying other users' preferences
    const userId = await requireAuth(ctx);
    const now = Date.now();

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const quizAnswers =
      args.quizAnswers !== undefined
        ? args.quizAnswers
        : existingUser?.quizAnswers;

    const preferences: {
      preferredMode: "web" | "background";
      backgroundAgentEnabled: boolean;
      updatedAt: number;
      quizAnswers?: { reason?: string } | undefined;
    } = {
      preferredMode: args.mode,
      backgroundAgentEnabled: args.mode === "background",
      updatedAt: now,
    };

    if (quizAnswers !== undefined) {
      preferences.quizAnswers = quizAnswers;
    }

    if (existingUser) {
      await ctx.db.patch(existingUser._id, preferences);
      return existingUser._id;
    }

    const newUser = {
      userId,
      createdAt: now,
      ...preferences,
    };
    return ctx.db.insert("users", newUser);
  },
});
