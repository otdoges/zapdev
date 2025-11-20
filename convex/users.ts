import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertEmailVerification = mutation({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    emailVerified: v.boolean(),
    verifiedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email,
        emailVerified: args.emailVerified,
        verifiedAt: args.verifiedAt ?? existing.verifiedAt,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("users", {
      userId: args.userId,
      email: args.email,
      emailVerified: args.emailVerified,
      verifiedAt: args.verifiedAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});
