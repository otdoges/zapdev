import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get background agent settings for a user
export const getSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("backgroundAgentSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!settings) {
      // Return default settings if none exist
      return {
        userId: args.userId,
        enabled: false,
        mode: "manual" as const,
        autoTriggers: [],
        githubRepos: [],
        restrictions: [
          "Do not delete any files or code",
          "Do not make breaking changes",
          "Do not modify authentication or security code",
          "Do not access sensitive data or credentials"
        ],
        notificationPreferences: {
          onStart: true,
          onComplete: true,
          onError: true,
        },
        maxConcurrentTasks: 3,
        dailyTaskLimit: 10,
        tasksRunToday: 0,
        lastResetDate: Date.now(),
      };
    }

    return settings;
  },
});

// Update background agent settings
export const updateSettings = mutation({
  args: {
    userId: v.string(),
    enabled: v.optional(v.boolean()),
    mode: v.optional(v.union(v.literal("manual"), v.literal("auto"), v.literal("scheduled"))),
    autoTriggers: v.optional(v.array(v.string())),
    schedule: v.optional(v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      time: v.string(),
      dayOfWeek: v.optional(v.number()),
      dayOfMonth: v.optional(v.number()),
    })),
    githubRepos: v.optional(v.array(v.string())),
    restrictions: v.optional(v.array(v.string())),
    notificationPreferences: v.optional(v.object({
      onStart: v.boolean(),
      onComplete: v.boolean(),
      onError: v.boolean(),
      email: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const existingSettings = await ctx.db
      .query("backgroundAgentSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existingSettings) {
      // Update existing settings
      const updates: any = {
        updatedAt: now,
      };

      if (args.enabled !== undefined) updates.enabled = args.enabled;
      if (args.mode !== undefined) updates.mode = args.mode;
      if (args.autoTriggers !== undefined) updates.autoTriggers = args.autoTriggers;
      if (args.schedule !== undefined) updates.schedule = args.schedule;
      if (args.githubRepos !== undefined) updates.githubRepos = args.githubRepos;
      if (args.restrictions !== undefined) updates.restrictions = args.restrictions;
      if (args.notificationPreferences !== undefined) {
        updates.notificationPreferences = args.notificationPreferences;
      }

      await ctx.db.patch(existingSettings._id, updates);
      return existingSettings._id;
    } else {
      // Create new settings
      return await ctx.db.insert("backgroundAgentSettings", {
        userId: args.userId,
        enabled: args.enabled || false,
        mode: args.mode || "manual",
        autoTriggers: args.autoTriggers || [],
        schedule: args.schedule,
        githubRepos: args.githubRepos || [],
        restrictions: args.restrictions || [
          "Do not delete any files or code",
          "Do not make breaking changes",
          "Do not modify authentication or security code",
          "Do not access sensitive data or credentials"
        ],
        notificationPreferences: args.notificationPreferences || {
          onStart: true,
          onComplete: true,
          onError: true,
        },
        maxConcurrentTasks: 3,
        dailyTaskLimit: 10,
        tasksRunToday: 0,
        lastResetDate: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Create a new background agent task
export const createTask = mutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("code_review"),
      v.literal("dependency_update"),
      v.literal("performance_optimization"),
      v.literal("security_scan"),
      v.literal("documentation"),
      v.literal("test_generation"),
      v.literal("bug_fix"),
      v.literal("feature_enhancement")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    githubRepo: v.string(),
    branch: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user has Pro subscription
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription || subscription.planType === "free") {
      throw new Error("Background agents are a Pro feature");
    }

    // Check daily task limit
    const settings = await ctx.db
      .query("backgroundAgentSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (settings) {
      const now = Date.now();
      const dayStart = new Date(now).setHours(0, 0, 0, 0);

      let newTasksRunToday = (settings.tasksRunToday ?? 0) + 1;
      let resetFields: any = {};
      if (settings.lastResetDate < dayStart) {
        newTasksRunToday = 1; // first task today after reset
        resetFields = { lastResetDate: now };
      }

      if (newTasksRunToday > settings.dailyTaskLimit) {
        throw new Error(`Daily task limit of ${settings.dailyTaskLimit} reached`);
      }

      await ctx.db.patch(settings._id, {
        tasksRunToday: newTasksRunToday,
        updatedAt: now,
        ...resetFields,
      });
    }

    // Validate GitHub URL
    const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
    if (!githubUrlRegex.test(args.githubRepo)) {
      throw new Error("Invalid GitHub repository URL. Please use format: https://github.com/owner/repo");
    }

    const now = Date.now();
    const taskId = `task_${args.userId}_${now}`;

    return await ctx.db.insert("backgroundAgentTasks", {
      userId: args.userId,
      taskId,
      type: args.type,
      status: "pending",
      priority: args.priority,
      githubRepo: args.githubRepo,
      branch: args.branch || "main",
      title: args.title,
      description: args.description,
      scheduledFor: args.scheduledFor,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get user's background agent tasks
export const getTasks = query({
  args: {
    userId: v.string(),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("backgroundAgentTasks")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    if (args.status !== undefined) {
      query = ctx.db
        .query("backgroundAgentTasks")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.userId).eq("status", args.status as any)
        );
    }

    const tasks = await query
      .order("desc")
      .take(args.limit || 50);

    return tasks;
  },
});

// Get a specific task
export const getTask = query({
  args: {
    taskId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("backgroundAgentTasks")
      .withIndex("by_task_id", (q) => q.eq("taskId", args.taskId))
      .first();

    if (!task || task.userId !== args.userId) {
      return null;
    }

    return task;
  },
});

// Cancel a task
export const cancelTask = mutation({
  args: {
    taskId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("backgroundAgentTasks")
      .withIndex("by_task_id", (q) => q.eq("taskId", args.taskId))
      .first();

    if (!task || task.userId !== args.userId) {
      throw new Error("Task not found");
    }

    if (task.status !== "pending" && task.status !== "running") {
      throw new Error("Cannot cancel completed or failed tasks");
    }

    await ctx.db.patch(task._id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return task._id;
  },
});

// Get task statistics
export const getTaskStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("backgroundAgentTasks")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      running: tasks.filter(t => t.status === "running").length,
      completed: tasks.filter(t => t.status === "completed").length,
      failed: tasks.filter(t => t.status === "failed").length,
      cancelled: tasks.filter(t => t.status === "cancelled").length,
      todayTasks: tasks.filter(t => {
        const today = new Date().setHours(0, 0, 0, 0);
        return t.createdAt >= today;
      }).length,
    };

    return stats;
  },
});

// Add a GitHub repository to allowed list
export const addGitHubRepo = mutation({
  args: {
    userId: v.string(),
    repoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate GitHub URL
    const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
    if (!githubUrlRegex.test(args.repoUrl)) {
      throw new Error("Invalid GitHub repository URL. Please use format: https://github.com/owner/repo");
    }

    const settings = await ctx.db
      .query("backgroundAgentSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!settings) {
      // Create new settings with the repo
      await ctx.db.insert("backgroundAgentSettings", {
        userId: args.userId,
        enabled: false,
        mode: "manual",
        autoTriggers: [],
        githubRepos: [args.repoUrl],
        restrictions: [
          "Do not delete any files or code",
          "Do not make breaking changes",
          "Do not modify authentication or security code",
          "Do not access sensitive data or credentials"
        ],
        notificationPreferences: {
          onStart: true,
          onComplete: true,
          onError: true,
        },
        maxConcurrentTasks: 3,
        dailyTaskLimit: 10,
        tasksRunToday: 0,
        lastResetDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      // Add repo to existing list if not already present
      const repos = settings.githubRepos || [];
      if (!repos.includes(args.repoUrl)) {
        repos.push(args.repoUrl);
        await ctx.db.patch(settings._id, {
          githubRepos: repos,
          updatedAt: Date.now(),
        });
      }
    }

    return args.repoUrl;
  },
});

// Remove a GitHub repository from allowed list
export const removeGitHubRepo = mutation({
  args: {
    userId: v.string(),
    repoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("backgroundAgentSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (settings && settings.githubRepos) {
      const repos = settings.githubRepos.filter(repo => repo !== args.repoUrl);
      await ctx.db.patch(settings._id, {
        githubRepos: repos,
        updatedAt: Date.now(),
      });
    }

    return args.repoUrl;
  },
});
