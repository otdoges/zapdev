import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  issuePriorityEnum,
  issueCategoryEnum,
  issueComplexityEnum,
  issueWorkflowStatusEnum,
} from "./schema";

export const list = query({
  args: {
    status: v.optional(issueWorkflowStatusEnum),
    repoFullName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25;
    let issues =
      args.status
        ? await ctx.db
            .query("githubIssues")
            .withIndex("by_status", (q) => q.eq("status", args.status!))
            .collect()
        : await ctx.db.query("githubIssues").collect();

    if (args.repoFullName) {
      issues = issues.filter((issue) => issue.repoFullName === args.repoFullName);
    }

    issues = issues.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return issues.slice(0, limit);
  },
});

export const get = query({
  args: {
    issueId: v.id("githubIssues"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.issueId);
  },
});

export const updateTriage = mutation({
  args: {
    issueId: v.id("githubIssues"),
    priority: v.optional(issuePriorityEnum),
    category: v.optional(issueCategoryEnum),
    complexity: v.optional(issueComplexityEnum),
    estimateHours: v.optional(v.number()),
    triageSummary: v.optional(v.string()),
    triageMetadata: v.optional(v.any()),
    status: v.optional(issueWorkflowStatusEnum),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const payload = {
      priority: args.priority ?? issue.priority,
      category: args.category ?? issue.category,
      complexity: args.complexity ?? issue.complexity,
      estimateHours: args.estimateHours ?? issue.estimateHours,
      triageSummary: args.triageSummary ?? issue.triageSummary,
      triageMetadata: args.triageMetadata ?? issue.triageMetadata,
      status: args.status ?? issue.status ?? "TRIAGED",
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.issueId, payload);
    return { ...issue, ...payload };
  },
});

export const assignAgent = mutation({
  args: {
    issueId: v.id("githubIssues"),
    agentIdentifier: v.string(),
    status: v.optional(issueWorkflowStatusEnum),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const payload = {
      assignedAgent: args.agentIdentifier,
      status: args.status ?? "ASSIGNED",
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.issueId, payload);
    return { ...issue, ...payload };
  },
});

export const updateStatus = mutation({
  args: {
    issueId: v.id("githubIssues"),
    status: issueWorkflowStatusEnum,
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    await ctx.db.patch(args.issueId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { ...issue, status: args.status };
  },
});
