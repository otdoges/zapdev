import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a webhook event has already been processed
 */
export const isDuplicate = query({
    args: {
        idempotencyKey: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.idempotencyKey) {
            return false;
        }

        const event = await ctx.db
            .query("webhookEvents")
            .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
            .first();

        return event !== null;
    },
});

/**
 * Record a processed webhook event
 *
 * This uses an optimistic insert approach to handle race conditions.
 * If two concurrent requests try to insert the same idempotencyKey,
 * the second one will see the first and return duplicate=true.
 */
export const recordProcessedEvent = mutation({
    args: {
        idempotencyKey: v.string(),
        provider: v.string(),
        eventType: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const expiresAt = now + IDEMPOTENCY_TTL_MS;

        // First, check if event already exists (read)
        const existing = await ctx.db
            .query("webhookEvents")
            .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
            .first();

        if (existing) {
            // Event already recorded, no-op
            return { success: true, duplicate: true };
        }

        // Optimistic insert - if another concurrent request inserted between
        // our check and now, we'll detect it with a second check
        await ctx.db.insert("webhookEvents", {
            idempotencyKey: args.idempotencyKey,
            provider: args.provider,
            eventType: args.eventType,
            processedAt: now,
            expiresAt,
        });

        // Double-check for race condition: verify we were the first to insert
        const allWithKey = await ctx.db
            .query("webhookEvents")
            .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
            .collect();

        // If there's more than one record with this key, we had a race condition
        // This is extremely rare in practice due to Convex's transaction model
        if (allWithKey.length > 1) {
            // Sort by processedAt to find the winner
            allWithKey.sort((a, b) => a.processedAt - b.processedAt);

            // If we're not the first one, delete our insert and report duplicate
            if (allWithKey[0]._id !== allWithKey[allWithKey.length - 1]._id) {
                // Delete our duplicate insert
                const ourInsert = allWithKey.find(e => e.processedAt === now);
                if (ourInsert && ourInsert._id !== allWithKey[0]._id) {
                    await ctx.db.delete(ourInsert._id);
                    return { success: true, duplicate: true };
                }
            }
        }

        return { success: true, duplicate: false };
    },
});

/**
 * Clean up expired webhook events
 * This should be called periodically via a scheduled function
 */
export const cleanupExpiredEvents = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        // Find all expired events
        const expiredEvents = await ctx.db
            .query("webhookEvents")
            .withIndex("by_expiresAt")
            .filter((q) => q.lt(q.field("expiresAt"), now))
            .collect();

        // Delete them
        for (const event of expiredEvents) {
            await ctx.db.delete(event._id);
        }

        return { cleaned: expiredEvents.length };
    },
});
