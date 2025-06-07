import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// Get user by clerk ID - can only get your own user data
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Security check: Users can only get their own data
    if (identity.subject !== args.clerkId) {
      throw new Error("Unauthorized: You can only access your own user data");
    }
    
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get the current user's profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

// --- Internal mutations for Clerk webhooks ---

export const createUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, email, firstName, lastName, avatarUrl } = args;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) {
        console.warn(`User with Clerk ID ${clerkId} already exists. Skipping creation.`);
        return existingUser._id;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      clerkId,
      email,
      firstName,
      lastName,
      avatarUrl,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateUser = internalMutation({
    args: {
        clerkId: v.string(),
        email: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { clerkId, ...rest } = args;

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
            .first();

        if (!existingUser) {
            console.error(`User with Clerk ID ${clerkId} not found. Cannot update.`);
            return;
        }
        
        const updates = Object.fromEntries(
            Object.entries(rest).filter(([, v]) => v !== undefined)
        );
        await ctx.db.patch(existingUser._id, {
            ...updates,
            updatedAt: Date.now(),
        });
    }
});

export const deleteUser = internalMutation({
    args: {
      clerkId: v.string(),
    },
    handler: async (ctx, { clerkId }) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
            .first();

        if (!existingUser) {
            console.warn(`User with Clerk ID ${clerkId} not found for deletion.`);
            return;
        }

        await ctx.db.delete(existingUser._id);
    },
});
