import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
// Using Web Crypto API instead of Node crypto

// Check if user has secret access
export const hasSecretAccess = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const secretAccess = await ctx.db
      .query("secretAccess")
      .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
      .first();

    return {
      hasAccess: secretAccess?.hasAccess || false,
      isFirstUser: secretAccess?.isFirstUser || false,
    };
  },
});

// Check if any user has set up secret access (for first-time setup)
export const isSecretSetupComplete = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const firstUser = await ctx.db
      .query("secretAccess")
      .withIndex("by_access", (q: any) => q.eq("hasAccess", true))
      .first();

    return firstUser !== null;
  },
});

// Set up secret access (first user sets password)
export const setupSecretAccess = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx: MutationCtx, { password }: { password: string }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if secret access is already set up
    const existingSetup = await ctx.db
      .query("secretAccess")
      .withIndex("by_access", (q: any) => q.eq("hasAccess", true))
      .first();

    if (existingSetup) {
      throw new Error("Secret access is already configured");
    }

    // Hash the password using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Create secret access for this user
    await ctx.db.insert("secretAccess", {
      userId,
      hasAccess: true,
      passwordHash,
      isFirstUser: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Verify password and grant access
export const verifySecretPassword = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx: MutationCtx, { password }: { password: string }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the password hash from the first user who set it up
    const firstUserAccess = await ctx.db
      .query("secretAccess")
      .withIndex("by_access", (q: any) => q.eq("hasAccess", true))
      .filter((q: any) => q.eq(q.field("isFirstUser"), true))
      .first();

    if (!firstUserAccess?.passwordHash) {
      throw new Error("Secret access not configured");
    }

    // Hash the provided password and compare using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (passwordHash !== firstUserAccess.passwordHash) {
      throw new Error("Invalid password");
    }

    // Check if this user already has access
    const existingAccess = await ctx.db
      .query("secretAccess")
      .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
      .first();

    if (existingAccess) {
      // Update existing record
      await ctx.db.patch(existingAccess._id, {
        hasAccess: true,
        updatedAt: Date.now(),
      });
    } else {
      // Create new access record
      await ctx.db.insert("secretAccess", {
        userId,
        hasAccess: true,
        isFirstUser: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Revoke secret access
export const revokeSecretAccess = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const secretAccess = await ctx.db
      .query("secretAccess")
      .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
      .first();

    if (secretAccess) {
      await ctx.db.patch(secretAccess._id, {
        hasAccess: false,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});