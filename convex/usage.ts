import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, hasProAccess } from "./helpers";

// Constants matching the existing system
const FREE_POINTS = 5;
const PRO_POINTS = 100;
const DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const GENERATION_COST = 1;

/**
 * Check and consume credits for a generation
 * Returns true if credits were successfully consumed, false if insufficient credits
 */
export const checkAndConsumeCredit = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; remaining: number; message?: string }> => {
    const userId = await requireAuth(ctx);
    const identity = await ctx.auth.getUserIdentity();

    // Check user's plan
    const isPro = hasProAccess(identity);
    const maxPoints = isPro ? PRO_POINTS : FREE_POINTS;

    // Get current usage
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    const expiryTime = now + DURATION_MS;

    // If no usage record or expired, create/reset with max points
    if (!usage || (usage.expire && usage.expire < now)) {
      if (usage) {
        // Reset expired usage
        await ctx.db.patch(usage._id, {
          points: maxPoints - GENERATION_COST,
          expire: expiryTime,
          planType: isPro ? "pro" : "free",
        });
      } else {
        // Create new usage record
        await ctx.db.insert("usage", {
          userId,
          points: maxPoints - GENERATION_COST,
          expire: expiryTime,
          planType: isPro ? "pro" : "free",
        });
      }
      return { success: true, remaining: maxPoints - GENERATION_COST };
    }

    // Check if user has enough points
    if (usage.points < GENERATION_COST) {
      const timeUntilReset = usage.expire ? Math.ceil((usage.expire - now) / 1000 / 60) : 0;
      return {
        success: false,
        remaining: usage.points,
        message: `Insufficient credits. Your credits will reset in ${timeUntilReset} minutes.`
      };
    }

    // Consume the credit
    await ctx.db.patch(usage._id, {
      points: usage.points - GENERATION_COST,
    });

    return { success: true, remaining: usage.points - GENERATION_COST };
  },
});

/**
 * Get current usage stats for a user
 */
export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const identity = await ctx.auth.getUserIdentity();

    const isPro = hasProAccess(identity);
    const maxPoints = isPro ? PRO_POINTS : FREE_POINTS;

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    // If no usage or expired, return max points
    if (!usage || (usage.expire && usage.expire < now)) {
      return {
        points: maxPoints,
        maxPoints,
        expire: now + DURATION_MS,
        planType: isPro ? "pro" : "free",
      };
    }

    return {
      points: usage.points,
      maxPoints,
      expire: usage.expire || now + DURATION_MS,
      planType: usage.planType || (isPro ? "pro" : "free"),
    };
  },
});

/**
 * Admin function to reset usage for a user
 */
export const resetUsage = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // In production, add admin authorization check here
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (usage) {
      await ctx.db.delete(usage._id);
    }
  },
});
