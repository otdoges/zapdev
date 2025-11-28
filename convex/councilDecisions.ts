import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth } from "./helpers";

export const listByJob = query({
  args: { jobId: v.id("backgroundJobs") },
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
