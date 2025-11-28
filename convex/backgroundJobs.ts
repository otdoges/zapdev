import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db
      .query("backgroundJobs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { jobId: v.id("backgroundJobs") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("backgroundJobs"),
      _creationTime: v.number(),
      userId: v.string(),
      projectId: v.optional(v.id("projects")),
      title: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled")
      ),
      sandboxId: v.optional(v.string()),
      logs: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
      completedAt: v.optional(v.number()),
    })
  ),
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
});

export const updateStatus = mutation({
  args: {
    jobId: v.id("backgroundJobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, { status: args.status, updatedAt: Date.now() });
  },
});

export const updateSandbox = mutation({
  args: {
    jobId: v.id("backgroundJobs"),
    sandboxId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, { sandboxId: args.sandboxId, updatedAt: Date.now() });
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
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) return;

    await ctx.db.insert("councilDecisions", {
      jobId: args.jobId,
      step: args.step,
      agents: args.agents,
      verdict: args.verdict,
      reasoning: args.reasoning,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});
