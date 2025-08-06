import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Helper function to get authenticated user
const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User must be authenticated");
  }
  return identity;
};

// Record a usage event for billing and analytics
export const recordUsageEvent = mutation({
  args: {
    eventName: v.string(),
    metadata: v.object({
      requests: v.optional(v.number()),
      duration: v.optional(v.number()),
      size: v.optional(v.number()),
      conversationId: v.optional(v.string()),
      codeExecutionId: v.optional(v.string()),
      model: v.optional(v.string()),
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
      cost: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Validate event name
    if (!args.eventName || args.eventName.trim().length === 0) {
      throw new Error("Event name is required");
    }
    
    if (args.eventName.length > 100) {
      throw new Error("Event name too long (max 100 characters)");
    }

    // Sanitize and validate metadata
    const sanitizedMetadata = {
      requests: typeof args.metadata.requests === 'number' && args.metadata.requests >= 0 ? args.metadata.requests : undefined,
      duration: typeof args.metadata.duration === 'number' && args.metadata.duration >= 0 ? args.metadata.duration : undefined,
      size: typeof args.metadata.size === 'number' && args.metadata.size >= 0 ? args.metadata.size : undefined,
      conversationId: typeof args.metadata.conversationId === 'string' ? args.metadata.conversationId.trim().substring(0, 100) : undefined,
      codeExecutionId: typeof args.metadata.codeExecutionId === 'string' ? args.metadata.codeExecutionId.trim().substring(0, 100) : undefined,
      model: typeof args.metadata.model === 'string' ? args.metadata.model.trim().substring(0, 100) : undefined,
      inputTokens: typeof args.metadata.inputTokens === 'number' && args.metadata.inputTokens >= 0 ? args.metadata.inputTokens : undefined,
      outputTokens: typeof args.metadata.outputTokens === 'number' && args.metadata.outputTokens >= 0 ? args.metadata.outputTokens : undefined,
      cost: typeof args.metadata.cost === 'number' && args.metadata.cost >= 0 ? Math.round(args.metadata.cost * 100000) / 100000 : undefined, // Round to 5 decimal places
    };

    const now = Date.now();
    
    const eventId = await ctx.db.insert("usageEvents", {
      eventName: args.eventName.trim(),
      userId: identity.subject,
      metadata: sanitizedMetadata,
      ingested: false, // Will be processed by billing system later
      timestamp: now,
      createdAt: now,
    });

    return eventId;
  },
});

// Batch record multiple usage events (for offline sync)
export const batchRecordUsageEvents = mutation({
  args: {
    events: v.array(v.object({
      eventName: v.string(),
      metadata: v.object({
        requests: v.optional(v.number()),
        duration: v.optional(v.number()),
        size: v.optional(v.number()),
        conversationId: v.optional(v.string()),
        codeExecutionId: v.optional(v.string()),
        model: v.optional(v.string()),
        inputTokens: v.optional(v.number()),
        outputTokens: v.optional(v.number()),
        cost: v.optional(v.number()),
      }),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Limit batch size
    if (args.events.length > 100) {
      throw new Error("Cannot batch more than 100 events at once");
    }

    const eventIds = [];
    const now = Date.now();

    for (const event of args.events) {
      // Validate event name
      if (!event.eventName || event.eventName.trim().length === 0) {
        continue; // Skip invalid events
      }
      
      if (event.eventName.length > 100) {
        continue; // Skip events with names too long
      }

      // Sanitize metadata (same as single event)
      const sanitizedMetadata = {
        requests: typeof event.metadata.requests === 'number' && event.metadata.requests >= 0 ? event.metadata.requests : undefined,
        duration: typeof event.metadata.duration === 'number' && event.metadata.duration >= 0 ? event.metadata.duration : undefined,
        size: typeof event.metadata.size === 'number' && event.metadata.size >= 0 ? event.metadata.size : undefined,
        conversationId: typeof event.metadata.conversationId === 'string' ? event.metadata.conversationId.trim().substring(0, 100) : undefined,
        codeExecutionId: typeof event.metadata.codeExecutionId === 'string' ? event.metadata.codeExecutionId.trim().substring(0, 100) : undefined,
        model: typeof event.metadata.model === 'string' ? event.metadata.model.trim().substring(0, 100) : undefined,
        inputTokens: typeof event.metadata.inputTokens === 'number' && event.metadata.inputTokens >= 0 ? event.metadata.inputTokens : undefined,
        outputTokens: typeof event.metadata.outputTokens === 'number' && event.metadata.outputTokens >= 0 ? event.metadata.outputTokens : undefined,
        cost: typeof event.metadata.cost === 'number' && event.metadata.cost >= 0 ? Math.round(event.metadata.cost * 100000) / 100000 : undefined,
      };

      const eventId = await ctx.db.insert("usageEvents", {
        eventName: event.eventName.trim(),
        userId: identity.subject,
        metadata: sanitizedMetadata,
        ingested: false,
        timestamp: event.timestamp,
        createdAt: now,
      });

      eventIds.push(eventId);
    }

    return { processed: eventIds.length, eventIds };
  },
});

// Get user's usage statistics for the current period
export const getUserUsageStats = query({
  args: {
    periodStart: v.optional(v.number()), // Default to start of current month
    periodEnd: v.optional(v.number()),   // Default to now
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Default to current month if no period specified
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const periodStart = args.periodStart || startOfMonth;
    const periodEnd = args.periodEnd || now.getTime();

    // Get all usage events for the user in the specified period
    const events = await ctx.db
      .query("usageEvents")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), periodStart),
          q.lte(q.field("timestamp"), periodEnd)
        )
      )
      .collect();

    // Calculate usage statistics
    const stats = {
      totalEvents: events.length,
      conversations: 0,
      codeExecutions: 0,
      totalCost: 0,
      totalTokens: 0,
      models: {} as Record<string, number>,
    };

    for (const event of events) {
      // Count conversation events
      if (event.eventName === 'ai_conversation' || event.eventName === 'chat_message') {
        stats.conversations++;
      }

      // Count code execution events
      if (event.eventName === 'code_execution' || event.eventName === 'e2b_execution') {
        stats.codeExecutions++;
      }

      // Sum up costs
      if (event.metadata.cost && typeof event.metadata.cost === 'number') {
        stats.totalCost += event.metadata.cost;
      }

      // Sum up tokens
      if (event.metadata.inputTokens && typeof event.metadata.inputTokens === 'number') {
        stats.totalTokens += event.metadata.inputTokens;
      }
      if (event.metadata.outputTokens && typeof event.metadata.outputTokens === 'number') {
        stats.totalTokens += event.metadata.outputTokens;
      }

      // Count models used
      if (event.metadata.model && typeof event.metadata.model === 'string') {
        stats.models[event.metadata.model] = (stats.models[event.metadata.model] || 0) + 1;
      }
    }

    // Round cost to 4 decimal places
    stats.totalCost = Math.round(stats.totalCost * 10000) / 10000;

    return {
      ...stats,
      periodStart,
      periodEnd,
    };
  },
});

// Get recent usage events for debugging/monitoring
export const getRecentUsageEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    const limit = Math.min(args.limit || 50, 200); // Max 200 events

    const events = await ctx.db
      .query("usageEvents")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);

    return events;
  },
});

// Mark usage events as ingested (for billing system)
export const markEventsAsIngested = mutation({
  args: {
    eventIds: v.array(v.id("usageEvents")),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Limit batch size
    if (args.eventIds.length > 500) {
      throw new Error("Cannot mark more than 500 events at once");
    }

    let processed = 0;
    
    for (const eventId of args.eventIds) {
      const event = await ctx.db.get(eventId);
      
      if (!event) {
        continue; // Skip non-existent events
      }
      
      // Verify user owns this event
      if (event.userId !== identity.subject) {
        throw new Error(`Access denied for event ${eventId}`);
      }
      
      await ctx.db.patch(eventId, {
        ingested: true,
      });
      
      processed++;
    }

    return { processed };
  },
});