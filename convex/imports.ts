import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { importSourceEnum, importStatusEnum } from "./schema";
import { requireAuth } from "./helpers";

// Create a new import record
export const createImport = mutation({
  args: {
    projectId: v.id("projects"),
    messageId: v.optional(v.id("messages")),
    source: importSourceEnum,
    sourceId: v.string(),
    sourceName: v.string(),
    sourceUrl: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Verify project belongs to user
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or unauthorized");
    }

    const now = Date.now();

    return await ctx.db.insert("imports", {
      userId,
      projectId: args.projectId,
      messageId: args.messageId,
      source: args.source,
      sourceId: args.sourceId,
      sourceName: args.sourceName,
      sourceUrl: args.sourceUrl,
      status: "PENDING",
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get import by ID
export const getImport = query({
  args: {
    importId: v.id("imports"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord || importRecord.userId !== userId) {
      throw new Error("Import not found or unauthorized");
    }

    return importRecord;
  },
});

// List imports by project
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Verify project belongs to user
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or unauthorized");
    }

    return await ctx.db
      .query("imports")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List all imports for user
export const listByUser = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    return await ctx.db
      .query("imports")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Update import status
export const updateStatus = mutation({
  args: {
    importId: v.id("imports"),
    status: importStatusEnum,
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord || importRecord.userId !== userId) {
      throw new Error("Import not found or unauthorized");
    }

    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.error) {
      updates.error = args.error;
    }

    if (args.metadata) {
      updates.metadata = {
        ...importRecord.metadata,
        ...args.metadata,
      };
    }

    return await ctx.db.patch(args.importId, updates);
  },
});

// Mark import as processing
export const markProcessing = mutation({
  args: {
    importId: v.id("imports"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord || importRecord.userId !== userId) {
      throw new Error("Import not found or unauthorized");
    }

    return await ctx.db.patch(args.importId, {
      status: "PROCESSING",
      updatedAt: Date.now(),
    });
  },
});

// Mark import as complete
export const markComplete = mutation({
  args: {
    importId: v.id("imports"),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord || importRecord.userId !== userId) {
      throw new Error("Import not found or unauthorized");
    }

    return await ctx.db.patch(args.importId, {
      status: "COMPLETE",
      metadata: args.metadata || importRecord.metadata,
      updatedAt: Date.now(),
    });
  },
});

// Mark import as failed
export const markFailed = mutation({
  args: {
    importId: v.id("imports"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord || importRecord.userId !== userId) {
      throw new Error("Import not found or unauthorized");
    }

    return await ctx.db.patch(args.importId, {
      status: "FAILED",
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});
