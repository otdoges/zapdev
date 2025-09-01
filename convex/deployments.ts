import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Helper function to get authenticated user
const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User must be authenticated");
  }
  return identity;
};

// Check if user has reached deployment limit (free tier: 10 sites)
const checkDeploymentLimit = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  maxDeployments: number = 10
) => {
  const existing = await ctx.db
    .query("deployedSites")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .collect();
    
  if (existing.length >= maxDeployments) {
    throw new Error(
      `Deployment limit reached: You can deploy up to ${maxDeployments} sites on the free plan. Upgrade to Pro for unlimited deployments.`
    );
  }
};

// Get all deployments for the authenticated user
export const getUserDeployments = query({
  args: {
    status: v.optional(v.union(v.literal("building"), v.literal("ready"), v.literal("error"), v.literal("queued"))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    const limit = Math.min(args.limit || 50, 100); // Max 100 at once
    const offset = Math.max(args.offset || 0, 0);
    
    let query = ctx.db
      .query("deployedSites")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject));
    
    if (args.status) {
      query = ctx.db
        .query("deployedSites")
        .withIndex("by_user_status", (q) => 
          q.eq("userId", identity.subject).eq("status", args.status!)
        );
    }
    
    const deployments = await query
      .order("desc")
      .take(limit + offset);
    
    // Apply offset manually since Convex doesn't have built-in offset
    return deployments.slice(offset, offset + limit);
  },
});

// Get a specific deployment by site ID
export const getDeployment = query({
  args: { 
    siteId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    const deployment = await ctx.db
      .query("deployedSites")
      .withIndex("by_site_id", (q) => q.eq("siteId", args.siteId))
      .first();
    
    if (!deployment) {
      throw new Error("Deployment not found");
    }
    
    if (deployment.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    return deployment;
  },
});

// Create a new deployment
export const createDeployment = mutation({
  args: {
    siteId: v.string(),
    name: v.string(),
    url: v.string(),
    vercelDeploymentId: v.optional(v.string()),
    sandboxId: v.optional(v.string()),
    chatId: v.optional(v.id("chats")),
    projectFiles: v.optional(v.string()),
    framework: v.optional(v.string()),
    environmentVars: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Check deployment limit
    await checkDeploymentLimit(ctx, identity.subject, 10);
    
    const now = Date.now();
    
    const deploymentId = await ctx.db.insert("deployedSites", {
      userId: identity.subject,
      siteId: args.siteId,
      name: args.name,
      url: args.url,
      vercelDeploymentId: args.vercelDeploymentId,
      status: "building",
      sandboxId: args.sandboxId,
      chatId: args.chatId,
      projectFiles: args.projectFiles,
      framework: args.framework || "nextjs",
      nodeVersion: "18.x",
      environmentVars: args.environmentVars,
      lastDeployedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    
    return deploymentId;
  },
});

// Update deployment status
export const updateDeploymentStatus = mutation({
  args: {
    siteId: v.string(),
    status: v.union(v.literal("building"), v.literal("ready"), v.literal("error"), v.literal("queued")),
    buildLogs: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    const deployment = await ctx.db
      .query("deployedSites")
      .withIndex("by_site_id", (q) => q.eq("siteId", args.siteId))
      .first();
    
    if (!deployment) {
      throw new Error("Deployment not found");
    }
    
    if (deployment.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };
    
    if (args.buildLogs !== undefined) {
      updateData.buildLogs = args.buildLogs;
    }
    if (args.errorMessage !== undefined) {
      updateData.errorMessage = args.errorMessage;
    }
    if (args.url !== undefined) {
      updateData.url = args.url;
    }
    
    await ctx.db.patch(deployment._id, updateData);
    
    return deployment._id;
  },
});

// Delete a deployment
export const deleteDeployment = mutation({
  args: {
    siteId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    const deployment = await ctx.db
      .query("deployedSites")
      .withIndex("by_site_id", (q) => q.eq("siteId", args.siteId))
      .first();
    
    if (!deployment) {
      throw new Error("Deployment not found");
    }
    
    if (deployment.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    // Delete associated analytics data
    const analytics = await ctx.db
      .query("siteAnalytics")
      .withIndex("by_site_id", (q) => q.eq("siteId", args.siteId))
      .collect();
    
    for (const analytic of analytics) {
      await ctx.db.delete(analytic._id);
    }
    
    // Delete the deployment
    await ctx.db.delete(deployment._id);
    
    return args.siteId;
  },
});

// Get deployment statistics for user
export const getUserDeploymentStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getAuthenticatedUser(ctx);
    
    const deployments = await ctx.db
      .query("deployedSites")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect();
    
    const totalDeployments = deployments.length;
    const activeDeployments = deployments.filter(d => d.status === "ready").length;
    const buildingDeployments = deployments.filter(d => d.status === "building").length;
    const failedDeployments = deployments.filter(d => d.status === "error").length;
    
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const recentDeployments = deployments.filter(d => d.createdAt > oneWeekAgo).length;
    const monthlyDeployments = deployments.filter(d => d.createdAt > oneMonthAgo).length;
    
    return {
      totalDeployments,
      activeDeployments,
      buildingDeployments,
      failedDeployments,
      recentDeployments,
      monthlyDeployments,
      deploymentLimit: 10, // Free tier limit
      deploymentSlots: Math.max(0, 10 - totalDeployments),
    };
  },
});

// Search deployments by name
export const searchDeployments = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    const searchTerm = args.searchTerm.trim();
    if (searchTerm.length < 2) {
      throw new Error("Search term must be at least 2 characters long");
    }
    
    const limit = Math.min(args.limit || 20, 50);
    
    const deployments = await ctx.db
      .query("deployedSites")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .filter((q) => 
        q.or(
          q.like(q.field("name"), `%${searchTerm}%`),
          q.like(q.field("url"), `%${searchTerm}%`)
        )
      )
      .order("desc")
      .take(limit);
    
    return deployments;
  },
});