import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  issueCategoryEnum,
  issueComplexityEnum,
  issuePriorityEnum,
  issueWorkflowStatusEnum,
  pullRequestStatusEnum,
} from "./schema";
import type { Id } from "./_generated/dataModel";

const normalizeLabels = (labels?: string[] | null) =>
  Array.isArray(labels)
    ? labels.filter((label): label is string => typeof label === "string" && label.length > 0)
    : undefined;

export const upsertIssueFromWebhook = mutation({
  args: {
    repoFullName: v.string(),
    issueNumber: v.number(),
    githubIssueId: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    title: v.string(),
    body: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    projectId: v.optional(v.id("projects")),
    priority: v.optional(issuePriorityEnum),
    category: v.optional(issueCategoryEnum),
    complexity: v.optional(issueComplexityEnum),
    status: v.optional(issueWorkflowStatusEnum),
    syncedAt: v.optional(v.number()),
    triageSummary: v.optional(v.string()),
    triageMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("githubIssues")
      .withIndex("by_repo_issue", (q) =>
        q.eq("repoFullName", args.repoFullName).eq("issueNumber", args.issueNumber)
      )
      .first();

    const payload = {
      repoFullName: args.repoFullName,
      issueNumber: args.issueNumber,
      githubIssueId: args.githubIssueId,
      issueUrl: args.issueUrl,
      title: args.title,
      body: args.body,
      labels: normalizeLabels(args.labels),
      priority: args.priority ?? existing?.priority ?? undefined,
      category: args.category ?? existing?.category ?? undefined,
      complexity: args.complexity ?? existing?.complexity ?? undefined,
      status: args.status ?? existing?.status ?? "UNTRIAGED",
      estimateHours: existing?.estimateHours,
      assignedAgent: existing?.assignedAgent,
      triageSummary: args.triageSummary ?? existing?.triageSummary,
      triageMetadata: args.triageMetadata ?? existing?.triageMetadata,
      projectId: args.projectId ?? existing?.projectId,
      syncedAt: args.syncedAt ?? now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    const issueId = await ctx.db.insert("githubIssues", payload);
    return issueId;
  },
});

export const savePullRequestRecord = mutation({
  args: {
    issueId: v.optional(v.id("githubIssues")),
    repoFullName: v.string(),
    branchName: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    prNumber: v.optional(v.number()),
    prUrl: v.optional(v.string()),
    status: pullRequestStatusEnum,
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("pullRequests")
      .withIndex("by_repo", (q) => q.eq("repoFullName", args.repoFullName))
      .filter((q) => q.eq(q.field("branchName"), args.branchName))
      .first();

    const payload = {
      issueId: args.issueId,
      repoFullName: args.repoFullName,
      branchName: args.branchName,
      title: args.title,
      description: args.description,
      prNumber: args.prNumber,
      prUrl: args.prUrl,
      status: args.status,
      metadata: args.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    const prId = await ctx.db.insert("pullRequests", payload);
    return prId;
  },
});

export const listPullRequests = query({
  args: {
    repoFullName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    let pullRequests =
      args.repoFullName
        ? await ctx.db
            .query("pullRequests")
            .withIndex("by_repo", (q) => q.eq("repoFullName", args.repoFullName!))
            .collect()
        : await ctx.db.query("pullRequests").collect();

    pullRequests = pullRequests.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return pullRequests.slice(0, limit);
  },
});

export const getIssueByCompositeKey = query({
  args: {
    repoFullName: v.string(),
    issueNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("githubIssues")
      .withIndex("by_repo_issue", (q) =>
        q.eq("repoFullName", args.repoFullName).eq("issueNumber", args.issueNumber)
      )
      .first();
  },
});
