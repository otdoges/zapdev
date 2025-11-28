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
      preferredMode: v.union(v.literal("web"), v.literal("background")),
      quizAnswers: v.optional(v.any()),
      backgroundAgentEnabled: v.boolean(),
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
export const setPreferredMode = mutation({
  args: {
    mode: v.union(v.literal("web"), v.literal("background")),
    quizAnswers: v.optional(
export const setPreferredMode = mutation({
  args: {
    mode: v.union(v.literal("web"), v.literal("background")),
    quizAnswers: v.optional(v.any()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
