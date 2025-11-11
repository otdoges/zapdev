import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Check if a webhook event has already been processed
 */
export const checkEvent = query({
  args: {
    provider: v.string(), // e.g., "polar"
    eventId: v.string(), // Provider's unique event ID
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("webhookEvents")
      .withIndex("by_provider_eventId", (q) =>
        q.eq("provider", args.provider).eq("eventId", args.eventId)
      )
      .first();

    return event ?? null;
  },
});

/**
 * Create a new webhook event record
 */
export const create = mutation({
  args: {
    provider: v.string(),
    eventId: v.string(),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const eventId = await ctx.db.insert("webhookEvents", {
      provider: args.provider,
      eventId: args.eventId,
      eventType: args.eventType,
      payload: args.payload,
      processed: false,
      status: "pending",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return eventId;
  },
});

/**
 * Mark webhook event as processing
 */
export const markProcessing = mutation({
  args: {
    webhookEventId: v.id("webhookEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.webhookEventId, {
      status: "processing",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark webhook event as completed
 */
export const markCompleted = mutation({
  args: {
    webhookEventId: v.id("webhookEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.webhookEventId, {
      status: "completed",
      processed: true,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark webhook event as failed
 */
export const markFailed = mutation({
  args: {
    webhookEventId: v.id("webhookEvents"),
    error: v.string(),
    retryCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.webhookEventId, {
      status: "failed",
      error: args.error,
      retryCount: args.retryCount,
      lastRetry: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get webhook events by provider and status for retry processing
 */
export const getByProviderAndStatus = query({
  args: {
    provider: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhookEvents")
      .withIndex("by_provider_status", (q) =>
        q.eq("provider", args.provider).eq("status", args.status)
      )
      .collect();
  },
});

/**
 * Clean up old webhook events (older than 30 days)
 */
export const cleanupOldEvents = mutation({
  args: {
    ageMs: v.number(), // Age in milliseconds (e.g., 30 * 24 * 60 * 60 * 1000 for 30 days)
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.ageMs;
    const oldEvents = await ctx.db
      .query("webhookEvents")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", cutoffTime))
      .collect();

    let deletedCount = 0;
    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
      deletedCount++;
    }

    return deletedCount;
  },
});
