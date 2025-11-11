import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new email verification token
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return await ctx.db.insert("emailVerifications", {
      userId: args.userId,
      email: args.email,
      token: args.token,
      expiresAt,
      verified: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Verify an email using a token
 */
export const verify = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query("emailVerifications")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!verification) {
      throw new Error("Invalid verification token");
    }

    if (verification.expiresAt < Date.now()) {
      throw new Error("Verification token expired");
    }

    if (verification.verified) {
      throw new Error("Email already verified");
    }

    // Mark verification as complete
    await ctx.db.patch(verification._id, { verified: true });

    // Update user's emailVerified status
    await ctx.db.patch(verification.userId, { emailVerified: true });

    return { success: true, userId: verification.userId };
  },
});

/**
 * Get verification by token
 */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailVerifications")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

/**
 * Get all verifications for a user
 */
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailVerifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get verification by email
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailVerifications")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
  },
});

/**
 * Delete expired verifications (cleanup job)
 */
export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const allVerifications = await ctx.db.query("emailVerifications").collect();
    const now = Date.now();
    let deletedCount = 0;

    for (const verification of allVerifications) {
      if (verification.expiresAt < now) {
        await ctx.db.delete(verification._id);
        deletedCount++;
      }
    }

    return deletedCount;
  },
});
