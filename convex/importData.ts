import { internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Import a project from PostgreSQL CSV export
 * This is an internal mutation that bypasses auth checks
 * 
 * NOTE: userId should now be a Convex user ID (Id<"users">).
 * If migrating from old Clerk data, you must first create users
 * in the users table and pass the new Convex user IDs here.
 */
export const importProject = internalMutation({
  args: {
    oldId: v.string(), // Original PostgreSQL UUID
    name: v.string(),
    userId: v.id("users"), // References users table
    framework: v.union(
      v.literal("NEXTJS"),
      v.literal("ANGULAR"),
      v.literal("REACT"),
      v.literal("VUE"),
      v.literal("SVELTE")
    ),
    createdAt: v.string(), // ISO date string
    updatedAt: v.string(), // ISO date string
  },
  handler: async (ctx, args) => {
    const createdAt = new Date(args.createdAt).getTime();
    const updatedAt = new Date(args.updatedAt).getTime();

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      userId: args.userId,
      framework: args.framework,
      createdAt,
      updatedAt,
    });

    // Return both the new Convex ID and old PostgreSQL ID for mapping
    return { oldId: args.oldId, newId: projectId };
  },
});

/**
 * Import a message from PostgreSQL CSV export
 */
export const importMessage = internalMutation({
  args: {
    oldId: v.string(),
    content: v.string(),
    role: v.union(v.literal("USER"), v.literal("ASSISTANT")),
    type: v.union(v.literal("RESULT"), v.literal("ERROR"), v.literal("STREAMING")),
    status: v.union(v.literal("PENDING"), v.literal("STREAMING"), v.literal("COMPLETE")),
    oldProjectId: v.string(), // Old PostgreSQL project ID
    newProjectId: v.id("projects"), // New Convex project ID
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const createdAt = new Date(args.createdAt).getTime();
    const updatedAt = new Date(args.updatedAt).getTime();

    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      role: args.role,
      type: args.type,
      status: args.status,
      projectId: args.newProjectId,
      createdAt,
      updatedAt,
    });

    return { oldId: args.oldId, newId: messageId };
  },
});

/**
 * Import a fragment from PostgreSQL CSV export
 */
export const importFragment = internalMutation({
  args: {
    oldId: v.string(),
    oldMessageId: v.string(),
    newMessageId: v.id("messages"),
    sandboxId: v.optional(v.string()),
    sandboxUrl: v.string(),
    title: v.string(),
    files: v.any(), // JSON object
    metadata: v.optional(v.any()),
    framework: v.union(
      v.literal("NEXTJS"),
      v.literal("ANGULAR"),
      v.literal("REACT"),
      v.literal("VUE"),
      v.literal("SVELTE")
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const createdAt = new Date(args.createdAt).getTime();
    const updatedAt = new Date(args.updatedAt).getTime();

    const fragmentId = await ctx.db.insert("fragments", {
      messageId: args.newMessageId,
      sandboxId: args.sandboxId,
      sandboxUrl: args.sandboxUrl,
      title: args.title,
      files: args.files,
      metadata: args.metadata,
      framework: args.framework,
      createdAt,
      updatedAt,
    });

    return { oldId: args.oldId, newId: fragmentId };
  },
});

/**
 * Import a fragment draft from PostgreSQL CSV export
 */
export const importFragmentDraft = internalMutation({
  args: {
    oldId: v.string(),
    oldProjectId: v.string(),
    newProjectId: v.id("projects"),
    sandboxId: v.optional(v.string()),
    sandboxUrl: v.optional(v.string()),
    files: v.any(),
    framework: v.union(
      v.literal("NEXTJS"),
      v.literal("ANGULAR"),
      v.literal("REACT"),
      v.literal("VUE"),
      v.literal("SVELTE")
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const createdAt = new Date(args.createdAt).getTime();
    const updatedAt = new Date(args.updatedAt).getTime();

    const draftId = await ctx.db.insert("fragmentDrafts", {
      projectId: args.newProjectId,
      sandboxId: args.sandboxId,
      sandboxUrl: args.sandboxUrl,
      files: args.files,
      framework: args.framework,
      createdAt,
      updatedAt,
    });

    return { oldId: args.oldId, newId: draftId };
  },
});

/**
 * Import an attachment from PostgreSQL CSV export
 */
export const importAttachment = internalMutation({
  args: {
    oldId: v.string(),
    type: v.union(v.literal("IMAGE")),
    url: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    size: v.number(),
    oldMessageId: v.string(),
    newMessageId: v.id("messages"),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const createdAt = new Date(args.createdAt).getTime();
    const updatedAt = new Date(args.updatedAt).getTime();

    const attachmentId = await ctx.db.insert("attachments", {
      type: args.type,
      url: args.url,
      width: args.width,
      height: args.height,
      size: args.size,
      messageId: args.newMessageId,
      createdAt,
      updatedAt,
    });

    return { oldId: args.oldId, newId: attachmentId };
  },
});

/**
 * Import usage data from PostgreSQL CSV export
 * 
 * NOTE: userId should now be a Convex user ID (Id<"users">).
 * If migrating from old Clerk data, you must first create users
 * in the users table and pass the new Convex user IDs here.
 */
export const importUsage = internalMutation({
  args: {
    key: v.string(), // Original key like "rlflx:user_XXX"
    userId: v.id("users"), // References users table
    points: v.number(),
    expire: v.optional(v.string()), // ISO date string
  },
  handler: async (ctx, args) => {
    const expire = args.expire ? new Date(args.expire).getTime() : undefined;

    // Check if usage already exists for this user
    const existing = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing usage
      await ctx.db.patch(existing._id, {
        points: args.points,
        expire,
      });
      return { userId: args.userId, newId: existing._id };
    } else {
      // Create new usage
      const usageId = await ctx.db.insert("usage", {
        userId: args.userId,
        points: args.points,
        expire,
      });
      return { userId: args.userId, newId: usageId };
    }
  },
});

/**
 * Clear all data from all tables (USE WITH CAUTION - DEV ONLY)
 */
export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete in reverse dependency order
    const attachments = await ctx.db.query("attachments").collect();
    for (const attachment of attachments) {
      await ctx.db.delete(attachment._id);
    }

    const fragments = await ctx.db.query("fragments").collect();
    for (const fragment of fragments) {
      await ctx.db.delete(fragment._id);
    }

    const fragmentDrafts = await ctx.db.query("fragmentDrafts").collect();
    for (const draft of fragmentDrafts) {
      await ctx.db.delete(draft._id);
    }

    const messages = await ctx.db.query("messages").collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    const projects = await ctx.db.query("projects").collect();
    for (const project of projects) {
      await ctx.db.delete(project._id);
    }

    const usage = await ctx.db.query("usage").collect();
    for (const u of usage) {
      await ctx.db.delete(u._id);
    }

    return { success: true, message: "All data cleared" };
  },
});

/**
 * Clean up orphaned projects and related data (projects with invalid userId references)
 * This fixes schema validation errors when users table is missing references
 */
export const cleanupOrphanedProjects = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const validUserIds = new Set(allUsers.map((u) => u._id as string));

    let cleanedProjectsCount = 0;
    let cleanedUsageCount = 0;
    let cleanedOAuthCount = 0;
    let cleanedImportsCount = 0;
    const orphanedProjectIds: string[] = [];

    // 1. Find all orphaned projects
    const allProjects = await ctx.db.query("projects").collect();
    for (const project of allProjects) {
      if (!validUserIds.has(project.userId as any)) {
        orphanedProjectIds.push(project._id);
      }
    }

    // Delete all data related to orphaned projects in reverse dependency order
    for (const projectId of orphanedProjectIds) {
      // Delete attachments for messages in this project
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_projectId", (q) => q.eq("projectId", projectId as any))
        .collect();

      for (const message of messages) {
        const attachments = await ctx.db
          .query("attachments")
          .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
          .collect();

        for (const attachment of attachments) {
          await ctx.db.delete(attachment._id);
        }

        // Delete fragments for this message
        const fragments = await ctx.db
          .query("fragments")
          .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
          .collect();

        for (const fragment of fragments) {
          await ctx.db.delete(fragment._id);
        }

        // Delete the message itself
        await ctx.db.delete(message._id);
      }

      // Delete fragment drafts for this project
      const drafts = await ctx.db
        .query("fragmentDrafts")
        .withIndex("by_projectId", (q) => q.eq("projectId", projectId as any))
        .collect();

      for (const draft of drafts) {
        await ctx.db.delete(draft._id);
      }

      // Delete the project itself
      await ctx.db.delete(projectId as any);
      cleanedProjectsCount++;
    }

    // 2. Clean up orphaned usage records
    const allUsage = await ctx.db.query("usage").collect();
    for (const usage of allUsage) {
      if (!validUserIds.has(usage.userId as any)) {
        await ctx.db.delete(usage._id);
        cleanedUsageCount++;
      }
    }

    // 3. Clean up orphaned oauthConnections
    const allOAuth = await ctx.db.query("oauthConnections").collect();
    for (const oauth of allOAuth) {
      if (!validUserIds.has(oauth.userId as any)) {
        await ctx.db.delete(oauth._id);
        cleanedOAuthCount++;
      }
    }

    // 4. Clean up orphaned imports
    const allImports = await ctx.db.query("imports").collect();
    for (const importRecord of allImports) {
      if (!validUserIds.has(importRecord.userId as any)) {
        await ctx.db.delete(importRecord._id);
        cleanedImportsCount++;
      }
    }

    const totalCleaned = cleanedProjectsCount + cleanedUsageCount + cleanedOAuthCount + cleanedImportsCount;

    return {
      success: true,
      message: `Cleaned up ${totalCleaned} orphaned records (${cleanedProjectsCount} projects, ${cleanedUsageCount} usage, ${cleanedOAuthCount} oauth, ${cleanedImportsCount} imports)`,
      cleanedProjectCount: cleanedProjectsCount,
      cleanedUsageCount,
      cleanedOAuthCount,
      cleanedImportsCount,
      totalCleaned,
      orphanedProjectIds,
    };
  },
});

// Public action wrappers for HTTP client access
export const importProjectAction = action({
  args: {
    oldId: v.string(),
    name: v.string(),
    userId: v.id("users"), // References users table
    framework: v.union(
      v.literal("NEXTJS"),
      v.literal("ANGULAR"),
      v.literal("REACT"),
      v.literal("VUE"),
      v.literal("SVELTE")
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args): Promise<{ oldId: string; newId: any }> => {
    return await ctx.runMutation(internal.importData.importProject, args);
  },
});

export const importMessageAction = action({
  args: {
    oldId: v.string(),
    content: v.string(),
    role: v.union(v.literal("USER"), v.literal("ASSISTANT")),
    type: v.union(v.literal("RESULT"), v.literal("ERROR"), v.literal("STREAMING")),
    status: v.union(v.literal("PENDING"), v.literal("STREAMING"), v.literal("COMPLETE")),
    oldProjectId: v.string(),
    newProjectId: v.id("projects"),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args): Promise<{ oldId: string; newId: any }> => {
    return await ctx.runMutation(internal.importData.importMessage, args);
  },
});

export const importFragmentAction = action({
  args: {
    oldId: v.string(),
    oldMessageId: v.string(),
    newMessageId: v.id("messages"),
    sandboxId: v.optional(v.string()),
    sandboxUrl: v.string(),
    title: v.string(),
    files: v.any(),
    metadata: v.optional(v.any()),
    framework: v.union(
      v.literal("NEXTJS"),
      v.literal("ANGULAR"),
      v.literal("REACT"),
      v.literal("VUE"),
      v.literal("SVELTE")
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args): Promise<{ oldId: string; newId: any }> => {
    return await ctx.runMutation(internal.importData.importFragment, args);
  },
});

export const importFragmentDraftAction = action({
  args: {
    oldId: v.string(),
    oldProjectId: v.string(),
    newProjectId: v.id("projects"),
    sandboxId: v.optional(v.string()),
    sandboxUrl: v.optional(v.string()),
    files: v.any(),
    framework: v.union(
      v.literal("NEXTJS"),
      v.literal("ANGULAR"),
      v.literal("REACT"),
      v.literal("VUE"),
      v.literal("SVELTE")
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args): Promise<{ oldId: string; newId: any }> => {
    return await ctx.runMutation(internal.importData.importFragmentDraft, args);
  },
});

export const importAttachmentAction = action({
  args: {
    oldId: v.string(),
    type: v.union(v.literal("IMAGE")),
    url: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    size: v.number(),
    oldMessageId: v.string(),
    newMessageId: v.id("messages"),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args): Promise<{ oldId: string; newId: any }> => {
    return await ctx.runMutation(internal.importData.importAttachment, args);
  },
});

export const importUsageAction = action({
  args: {
    key: v.string(),
    userId: v.id("users"), // References users table
    points: v.number(),
    expire: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ userId: string; newId: any }> => {
    return await ctx.runMutation(internal.importData.importUsage, args);
  },
});

/**
 * Public action to clean up ALL orphaned data (admin function)
 * Removes all projects, usage, oauthConnections, imports with invalid userId references
 */
export const cleanupOrphanedProjectsAction = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    cleanedProjectCount: number;
    cleanedUsageCount: number;
    cleanedOAuthCount: number;
    cleanedImportsCount: number;
    totalCleaned: number;
    orphanedProjectIds: string[];
  }> => {
    return await ctx.runMutation(internal.importData.cleanupOrphanedProjects);
  },
});
