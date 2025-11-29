import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./helpers";
import { backgroundJobStatusSchema, BackgroundJobStatus } from "./constants";
import { api } from "./_generated/api";

// Constants for validation
const MAX_TITLE_LENGTH = 200;
const MAX_STEP_LENGTH = 200;
const MAX_VERDICT_LENGTH = 200;
const MAX_REASONING_LENGTH = 1000;
const MAX_LOGS_ENTRIES = 100; // Keep only last 100 log entries to prevent document size issues

const backgroundJobSchema = v.object({
  _id: v.id("backgroundJobs"),
  _creationTime: v.number(),
  userId: v.string(),
  projectId: v.optional(v.id("projects")),
  title: v.string(),
  status: backgroundJobStatusSchema,
  sandboxId: v.optional(v.string()),
  logs: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
});

export const list = query({
  args: {},
  returns: v.array(backgroundJobSchema),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db
      .query("backgroundJobs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { jobId: v.id("backgroundJobs") },
  returns: v.union(v.null(), backgroundJobSchema),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) return null;
    return job;
  },
});

export const create = mutation({
  args: { title: v.string() },
  returns: v.id("backgroundJobs"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // SECURITY: Rate limiting - prevent job creation spam
    // Allow 10 jobs per hour per user
    const rateLimitKey = `user_${userId}_create-job`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour

    // Find existing rate limit record
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", rateLimitKey))
      .first();

    if (existing) {
      // Check if window has expired
      if (now - existing.windowStart < existing.windowMs) {
        // Window still active, check if limit exceeded
        if (existing.count >= existing.limit) {
          const resetTime = existing.windowStart + existing.windowMs;
          const secondsUntilReset = Math.ceil((resetTime - now) / 1000);
          throw new Error(
            `Rate limit exceeded. You can create ${existing.limit} jobs per hour. Try again in ${secondsUntilReset} seconds.`
          );
        }

        // Increment count
        await ctx.db.patch(existing._id, {
          count: existing.count + 1,
        });
      } else {
        // Window expired, reset
        await ctx.db.patch(existing._id, {
          count: 1,
          windowStart: now,
          limit: 10,
          windowMs,
        });
      }
    } else {
      // Create new rate limit record
      await ctx.db.insert("rateLimits", {
        key: rateLimitKey,
        count: 1,
        windowStart: now,
        limit: 10,
        windowMs,
      });
    }

    // Validate title
    const trimmedTitle = args.title.trim();
    if (trimmedTitle.length === 0) {
      throw new Error("Title cannot be empty");
    }
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      throw new Error(`Title too long (max ${MAX_TITLE_LENGTH} characters)`);
    }

    return await ctx.db.insert("backgroundJobs", {
      userId,
      title: trimmedTitle,
      status: "pending",
      logs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    jobId: v.id("backgroundJobs"),
    status: backgroundJobStatusSchema,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const updates: {
      status: BackgroundJobStatus;
      updatedAt: number;
      completedAt?: number;
    } = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "completed" || args.status === "failed" || args.status === "cancelled") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.jobId, updates);
    return null;
  },
});

export const updateSandbox = mutation({
  args: {
    jobId: v.id("backgroundJobs"),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.jobId, { sandboxId: args.sandboxId, updatedAt: Date.now() });
    return null;
  },
});

// Helper function to rotate logs (keep only last MAX_LOGS_ENTRIES)
function rotateLogs(logs: string[], newLog: string): string[] {
  const updatedLogs = [...logs, newLog];
  
  // If we exceed the limit, keep only the most recent entries
  if (updatedLogs.length > MAX_LOGS_ENTRIES) {
    return updatedLogs.slice(-MAX_LOGS_ENTRIES);
  }
  
  return updatedLogs;
}

export const addLog = mutation({
  args: {
    jobId: v.id("backgroundJobs"),
    log: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    // Rotate logs to prevent document size overflow
    const currentLogs = job.logs || [];
    const updatedLogs = rotateLogs(currentLogs, args.log);
    
    await ctx.db.patch(args.jobId, { 
      logs: updatedLogs, 
      updatedAt: Date.now() 
    });
    return null;
  },
});

export const addDecision = mutation({
  args: {
    jobId: v.id("backgroundJobs"),
    step: v.string(),
    agents: v.array(v.string()),
    verdict: v.string(),
    reasoning: v.string(),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Validate input lengths using constants
    const trimmedStep = args.step.trim();
    const trimmedVerdict = args.verdict.trim();
    const trimmedReasoning = args.reasoning.trim();
    
    if (trimmedStep.length === 0 || trimmedStep.length > MAX_STEP_LENGTH) {
      throw new Error(`Step must be between 1 and ${MAX_STEP_LENGTH} characters`);
    }
    if (trimmedVerdict.length === 0 || trimmedVerdict.length > MAX_VERDICT_LENGTH) {
      throw new Error(`Verdict must be between 1 and ${MAX_VERDICT_LENGTH} characters`);
    }
    if (trimmedReasoning.length === 0 || trimmedReasoning.length > MAX_REASONING_LENGTH) {
      throw new Error(`Reasoning must be between 1 and ${MAX_REASONING_LENGTH} characters`);
    }
    
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.insert("councilDecisions", {
      jobId: args.jobId,
      step: trimmedStep,
      agents: args.agents,
      verdict: trimmedVerdict,
      reasoning: trimmedReasoning,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
    return null;
  },
});
