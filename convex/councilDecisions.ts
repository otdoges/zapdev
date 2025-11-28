import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth } from "./helpers";

export const listByJob = query({
  args: { jobId: v.id("backgroundJobs") },
  returns: v.list(
    v.object({
      id: v.id("councilDecisions"),
      jobId: v.id("backgroundJobs"),
      step: v.string(),
      agents: v.array(v.string()),
      verdict: v.string(),
      reasoning: v.string(),
      metadata: v.optional(
        v.object({
          summary: v.optional(v.string()),
        })
      ),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { jobId }) => {
    const userId = await requireAuth(ctx);
    const job = await ctx.db.get(jobId);
    if (!job || job.userId !== userId) return [];

    return await ctx.db
      .query("councilDecisions")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .order("desc")
      .collect();
  },
});
