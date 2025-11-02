import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./helpers";
import { frameworkEnum } from "./schema";

/**
 * Create a new project
 */
export const create = mutation({
  args: {
    name: v.string(),
    framework: frameworkEnum,
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const now = Date.now();

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      userId,
      framework: args.framework,
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

/**
 * Get all projects for the current user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return projects;
  },
});

/**
 * Get a single project by ID
 */
export const get = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Ensure user owns the project
    if (project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return project;
  },
});

/**
 * Update a project
 */
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    framework: v.optional(frameworkEnum),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Ensure user owns the project
    if (project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.projectId, {
      ...(args.name && { name: args.name }),
      ...(args.framework && { framework: args.framework }),
      updatedAt: Date.now(),
    });

    return args.projectId;
  },
});

/**
 * Delete a project and all associated data (messages, fragments, etc.)
 */
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Ensure user owns the project
    if (project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete all messages for this project (and cascade to fragments/attachments)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const message of messages) {
      // Delete fragments for this message
      const fragment = await ctx.db
        .query("fragments")
        .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
        .first();
      if (fragment) {
        await ctx.db.delete(fragment._id);
      }

      // Delete attachments for this message
      const attachments = await ctx.db
        .query("attachments")
        .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
        .collect();
      for (const attachment of attachments) {
        await ctx.db.delete(attachment._id);
      }

      // Delete the message
      await ctx.db.delete(message._id);
    }

    // Delete fragment draft for this project
    const fragmentDraft = await ctx.db
      .query("fragmentDrafts")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .first();
    if (fragmentDraft) {
      await ctx.db.delete(fragmentDraft._id);
    }

    // Finally, delete the project
    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});

/**
 * Get or create fragment draft for a project
 */
export const getOrCreateFragmentDraft = mutation({
  args: {
    projectId: v.id("projects"),
    framework: frameworkEnum,
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const existingDraft = await ctx.db
      .query("fragmentDrafts")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .first();

    if (existingDraft) {
      return existingDraft;
    }

    const now = Date.now();
    const draftId = await ctx.db.insert("fragmentDrafts", {
      projectId: args.projectId,
      files: {},
      framework: args.framework,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(draftId);
  },
});
