import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new session
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    expiresAt: v.number(),
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      expiresAt: args.expiresAt,
      token: args.token,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    return sessionId;
  },
});

/**
 * Get session by token
 */
export const getByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    // Check if session is expired
    if (session && session.expiresAt < Date.now()) {
      // Don't return expired sessions
      return null;
    }

    return session;
  },
});

/**
 * Get all sessions for a user
 */
export const getByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter out expired sessions
    const now = Date.now();
    return sessions.filter((session) => session.expiresAt >= now);
  },
});

/**
 * Update session by token
 */
export const updateByToken = mutation({
  args: {
    token: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(session._id, {
      expiresAt: args.expiresAt,
    });

    return session._id;
  },
});

/**
 * Delete session by token
 */
export const deleteByToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    await ctx.db.delete(session._id);
    return true;
  },
});

/**
 * Delete all sessions for a user
 */
export const deleteByUserId = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return sessions.length;
  },
});

/**
 * Clean up expired sessions (should be called periodically)
 */
export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const allSessions = await ctx.db.query("sessions").collect();
    const now = Date.now();
    let deletedCount = 0;

    for (const session of allSessions) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
        deletedCount++;
      }
    }

    return deletedCount;
  },
});
