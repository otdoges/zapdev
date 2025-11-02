import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./helpers";
import { messageRoleEnum, messageTypeEnum, messageStatusEnum, frameworkEnum } from "./schema";

/**
 * Create a new message
 */
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    content: v.string(),
    role: messageRoleEnum,
    type: messageTypeEnum,
    status: v.optional(messageStatusEnum),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      projectId: args.projectId,
      content: args.content,
      role: args.role,
      type: args.type,
      status: args.status || "COMPLETE",
      createdAt: now,
      updatedAt: now,
    });

    return messageId;
  },
});

/**
 * Get all messages for a project
 */
export const list = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_projectId_createdAt", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();

    return messages;
  },
});

/**
 * Get a single message by ID
 */
export const get = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify project ownership
    const project = await ctx.db.get(message.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return message;
  },
});

/**
 * Update message status
 */
export const updateStatus = mutation({
  args: {
    messageId: v.id("messages"),
    status: messageStatusEnum,
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify project ownership
    const project = await ctx.db.get(message.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.messageId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.messageId;
  },
});

/**
 * Create or update a fragment for a message
 */
export const createFragment = mutation({
  args: {
    messageId: v.id("messages"),
    sandboxId: v.optional(v.string()),
    sandboxUrl: v.string(),
    title: v.string(),
    files: v.any(),
    metadata: v.optional(v.any()),
    framework: frameworkEnum,
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify project ownership
    const project = await ctx.db.get(message.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Check if fragment already exists for this message
    const existingFragment = await ctx.db
      .query("fragments")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .first();

    const now = Date.now();

    if (existingFragment) {
      // Update existing fragment
      await ctx.db.patch(existingFragment._id, {
        sandboxId: args.sandboxId,
        sandboxUrl: args.sandboxUrl,
        title: args.title,
        files: args.files,
        metadata: args.metadata,
        framework: args.framework,
        updatedAt: now,
      });
      return existingFragment._id;
    } else {
      // Create new fragment
      const fragmentId = await ctx.db.insert("fragments", {
        messageId: args.messageId,
        sandboxId: args.sandboxId,
        sandboxUrl: args.sandboxUrl,
        title: args.title,
        files: args.files,
        metadata: args.metadata,
        framework: args.framework,
        createdAt: now,
        updatedAt: now,
      });
      return fragmentId;
    }
  },
});

/**
 * Get fragment for a message
 */
export const getFragment = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify project ownership
    const project = await ctx.db.get(message.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const fragment = await ctx.db
      .query("fragments")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .first();

    return fragment;
  },
});

/**
 * Add attachment to a message
 */
export const addAttachment = mutation({
  args: {
    messageId: v.id("messages"),
    type: v.union(v.literal("IMAGE")),
    url: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify project ownership
    const project = await ctx.db.get(message.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    const attachmentId = await ctx.db.insert("attachments", {
      messageId: args.messageId,
      type: args.type,
      url: args.url,
      width: args.width,
      height: args.height,
      size: args.size,
      createdAt: now,
      updatedAt: now,
    });

    return attachmentId;
  },
});

/**
 * Get attachments for a message
 */
export const getAttachments = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify project ownership
    const project = await ctx.db.get(message.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .collect();

    return attachments;
  },
});
