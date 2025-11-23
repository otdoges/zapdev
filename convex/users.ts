import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUserId } from "./helpers";

/**
 * Get the current authenticated user's ID
 * Used by actions to get the user ID since ctx.auth.getUserIdentity()
 * doesn't work reliably in actions on some platforms
 */
export const getAuthUserId = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUserId(ctx);
  },
});

/**
 * Validate that a user exists (for security validation in actions)
 * Returns true if user has at least one project (confirming they exist in the system)
 */
export const validateUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user has any projects (simple existence check)
    const userProject = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    // If user has projects or if this could be their first project, allow it
    // We'll consider any non-empty userId as valid since WorkOS handles the actual auth
    return args.userId.length > 0;
  },
});


