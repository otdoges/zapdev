import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./helpers";
import { backgroundJobStatusSchema, BackgroundJobStatus } from "./constants";

const backgroundJobSchema = v.object({
  _id: v.id("backgroundJobs"),
  _creationTime: v.number(),
  userId: v.string(),
  projectId: v.optional(v.id("projects")),
  title: v.string().min(1).max(200),
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
      .take(50)
      .collect();
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
  args: { title: v.string().min(1).max(200) },
  returns: v.id("backgroundJobs"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    if (args.title.length > 200) {
      throw new Error("Title too long");
    }
    return await ctx.db.insert("backgroundJobs", {
      userId,
      title: args.title,
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

export const addDecision = mutation({
  args: {
    jobId: v.id("backgroundJobs"),
    step: v.string().min(1).max(200),
    agents: v.array(v.string()),
    verdict: v.string().min(1).max(200),
    reasoning: v.string().min(1).max(1000),
    metadata: v.optional(v.object({
      summary: v.optional(v.string()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.insert("councilDecisions", {
      jobId: args.jobId,
      step: args.step,
      agents: args.agents,
      verdict: args.verdict,
      reasoning: args.reasoning,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
    return null;
  },
});
