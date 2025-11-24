import { mutation } from "./_generated/server";
import { v } from "convex/values";

const WEBHOOK_EVENT_RETENTION_DAYS = 30;
const RETENTION_MS = WEBHOOK_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Check if a webhook event has been processed before and record it
 * SECURITY: Prevents replay attacks by tracking processed webhook event IDs
 *
 * @returns true if this is a new event (should be processed), false if already processed
 */
export const checkAndRecordWebhookEvent = mutation({
  args: {
    provider: v.string(),
    eventId: v.string(),
    eventType: v.string(),
    systemKey: v.string(), // Require system key for authorization
  },
  handler: async (ctx, args) => {
    // Verify system key
    if (args.systemKey !== process.env.SYSTEM_API_KEY) {
      throw new Error("Unauthorized: Invalid system key");
    }

    // Check if event was already processed
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_provider_eventId", (q) =>
        q.eq("provider", args.provider).eq("eventId", args.eventId)
      )
      .first();

    if (existing) {
      console.log(
        `[WEBHOOK] Replay detected: ${args.provider} event ${args.eventId} already processed at ${new Date(existing.processedAt).toISOString()}`
      );
      return false; // Event already processed (replay attack)
    }

    // Record this event as processed
    const now = Date.now();
    await ctx.db.insert("webhookEvents", {
      provider: args.provider,
      eventId: args.eventId,
      eventType: args.eventType,
      processedAt: now,
      expiresAt: now + RETENTION_MS,
    });

    console.log(
      `[WEBHOOK] Recorded new event: ${args.provider} ${args.eventType} (${args.eventId})`
    );
    return true; // New event, should be processed
  },
});

/**
 * Clean up expired webhook events (older than 30 days)
 * Call this periodically via cron or background job
 */
export const cleanupExpiredWebhookEvents = mutation({
  args: {
    systemKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify system key
    if (args.systemKey !== process.env.SYSTEM_API_KEY) {
      throw new Error("Unauthorized: Invalid system key");
    }

    const now = Date.now();

    // Find expired events
    const expiredEvents = await ctx.db
      .query("webhookEvents")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .take(100); // Batch delete to avoid timeouts

    // Delete expired events
    for (const event of expiredEvents) {
      await ctx.db.delete(event._id);
    }

    console.log(`[WEBHOOK] Cleaned up ${expiredEvents.length} expired webhook events`);
    return { deleted: expiredEvents.length };
  },
});
