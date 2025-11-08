import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { taskTypeEnum } from "./schema";

const sortTasks = <T extends { priority?: number | null; createdAt: number }>(tasks: T[]) =>
  tasks.sort((a, b) => {
    const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return a.createdAt - b.createdAt;
  });

export const enqueueTask = mutation({
  args: {
    type: taskTypeEnum,
    issueId: v.optional(v.id("githubIssues")),
    payload: v.optional(v.any()),
    priority: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      type: args.type,
      status: "PENDING",
      issueId: args.issueId,
      payload: args.payload,
      result: undefined,
      error: undefined,
      priority: args.priority ?? 5,
      attempts: 0,
      maxAttempts: args.maxAttempts ?? 3,
      scheduledAt: args.scheduledAt ?? now,
      startedAt: undefined,
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listPending = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect();

    return sortTasks(pending).slice(0, args.limit ?? 5);
  },
});

export const listActive = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const [pending, processing] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_status", (q) => q.eq("status", "PENDING")).collect(),
      ctx.db.query("tasks").withIndex("by_status", (q) => q.eq("status", "PROCESSING")).collect(),
    ]);

    const combined = sortTasks([...pending, ...processing]);
    return combined.slice(0, args.limit ?? 20);
  },
});

export const getTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const startTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.maxAttempts && task.attempts >= task.maxAttempts) {
      throw new Error("Task exceeded max attempts");
    }

    const now = Date.now();
    const attempts = task.attempts + 1;

    await ctx.db.patch(args.taskId, {
      status: "PROCESSING",
      attempts,
      startedAt: now,
      updatedAt: now,
    });

    return { ...task, status: "PROCESSING", attempts };
  },
});

export const completeTask = mutation({
  args: {
    taskId: v.id("tasks"),
    result: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: "COMPLETED",
      result: args.result,
      error: undefined,
      completedAt: now,
      updatedAt: now,
    });

    return { ...task, status: "COMPLETED", result: args.result };
  },
});

export const failTask = mutation({
  args: {
    taskId: v.id("tasks"),
    error: v.string(),
    requeue: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const now = Date.now();
    const nextStatus =
      args.requeue && (!task.maxAttempts || task.attempts < task.maxAttempts)
        ? ("PENDING" as const)
        : ("FAILED" as const);

    await ctx.db.patch(args.taskId, {
      status: nextStatus,
      error: args.error,
      updatedAt: now,
      ...(nextStatus === "PENDING"
        ? {
            startedAt: undefined,
            completedAt: undefined,
          }
        : {}),
    });

    return { ...task, status: nextStatus, error: args.error };
  },
});
