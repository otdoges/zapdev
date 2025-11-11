import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireAuth } from "./helpers";

/**
 * Get user by email
 */
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});

/**
 * Get user by Polar customer ID (internal only)
 *
 * SECURITY: This is an internalQuery to prevent unauthorized client access.
 * Polar customer IDs are sensitive identifiers that should not be exposed
 * to public queries, as they could allow user enumeration attacks.
 * This function is only callable from server-side code (mutations, API routes, webhooks).
 */
export const getByPolarCustomerId = internalQuery({
  args: {
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_polarCustomerId", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId)
      )
      .first();

    return user;
  },
});

/**
 * Update user's subscription information from Polar webhook
 */
export const updateSubscription = mutation({
  args: {
    polarCustomerId: v.string(),
    subscriptionId: v.string(),
    subscriptionStatus: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    // Find user by Polar customer ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_polarCustomerId", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId)
      )
      .first();

    if (!user) {
      throw new Error(
        `User not found for Polar customer ID: ${args.polarCustomerId}`
      );
    }

    // Update subscription details
    await ctx.db.patch(user._id, {
      subscriptionId: args.subscriptionId,
      subscriptionStatus: args.subscriptionStatus,
      plan: args.plan,
      updatedAt: Date.now(),
    });

    return { success: true, userId: user._id };
  },
});

/**
 * Link Polar customer ID to user
 */
export const linkPolarCustomer = mutation({
  args: {
    userId: v.string(), // Accept string (from session.user.id)
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Require authentication and verify ownership
    const authenticatedUserId = await requireAuth(ctx);
    if (authenticatedUserId !== args.userId) {
      throw new Error("Forbidden");
    }

    // Verify user exists before linking
    const user = await ctx.db.get(authenticatedUserId);
    if (!user) {
      throw new Error(`User not found for ID: ${authenticatedUserId}`);
    }

    // Perform Polar customer ID link only after ownership is confirmed
    await ctx.db.patch(authenticatedUserId, {
      polarCustomerId: args.polarCustomerId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove or restore a Polar customer link (used for compensating transactions)
 */
export const unlinkPolarCustomer = mutation({
  args: {
    userId: v.string(), // Accept string (from session.user.id)
    expectedPolarCustomerId: v.string(),
    restorePolarCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication and verify ownership
    const authenticatedUserId = await requireAuth(ctx);
    if (authenticatedUserId !== args.userId) {
      throw new Error("Forbidden");
    }

    // Verify user exists and has expected Polar customer ID before unlinking
    const user = await ctx.db.get(authenticatedUserId);
    if (!user) {
      throw new Error(`User not found for ID: ${authenticatedUserId}`);
    }

    if (user.polarCustomerId !== args.expectedPolarCustomerId) {
      throw new Error(
        `Polar customer ID mismatch for user ${authenticatedUserId}: expected ${args.expectedPolarCustomerId}, found ${user.polarCustomerId ?? "none"}`
      );
    }

    // Perform Polar customer ID unlink/restore only after ownership and validation is confirmed
    await ctx.db.patch(authenticatedUserId, {
      polarCustomerId: args.restorePolarCustomerId,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      restored: typeof args.restorePolarCustomerId === "string",
    };
  },
});

/**
 * Get user's subscription status
 */
export const getSubscriptionStatus = query({
  args: {
    userId: v.string(), // Accept string (from session.user.id)
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as Id<"users">);

    if (!user) {
      return null;
    }

    return {
      plan: user.plan || "free",
      subscriptionStatus: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
      polarCustomerId: user.polarCustomerId,
    };
  },
});

/**
 * Create or update user (for Better Auth integration)
 */
export const createOrUpdate = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        image: args.image,
        emailVerified: args.emailVerified,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      image: args.image,
      emailVerified: args.emailVerified ?? false,
      plan: "free",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Get user by ID
 */
export const getById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Update user information
 */
export const update = mutation({
  args: {
    userId: v.id("users"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authenticatedUserId = await requireAuth(ctx);
    if (authenticatedUserId !== args.userId) {
      throw new Error("Forbidden");
    }

    const allowedFields: Array<keyof Pick<Doc<"users">, "email" | "name" | "image">> = [
      "email",
      "name",
      "image",
    ];

    const updates: Partial<Pick<Doc<"users">, "email" | "name" | "image">> = {};
    for (const field of allowedFields) {
      if (typeof args[field] !== "undefined") {
        updates[field] = args[field] as Doc<"users">[typeof field];
      }
    }

    await ctx.db.patch(args.userId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return args.userId;
  },
});

/**
 * Delete user and all associated data
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.subject) {
      throw new Error("Unauthorized");
    }

    const authenticatedUserId = identity.subject as Id<"users">;
    if (authenticatedUserId !== args.userId) {
      throw new Error("Forbidden");
    }

    // Delete user's sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete user's accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // Delete user's projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const project of projects) {
      await ctx.db.delete(project._id);
    }

    // Delete user's usage records
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const record of usage) {
      await ctx.db.delete(record._id);
    }

    // Finally, delete the user
    await ctx.db.delete(args.userId);

    return true;
  },
});
