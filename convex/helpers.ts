import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Get the current authenticated user's ID from Stack Auth
 * Stack Auth automatically sets ctx.auth when a user is authenticated
 */
export async function getCurrentUserId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  // Get user ID from Convex auth context
  // Convex's auth system provides the subject (user ID) via ctx.auth
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

/**
 * Get the current authenticated user's ID or throw an error
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const userId = await getCurrentUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Check if user has pro access
 * For now, check if user has a plan field set to "pro" in their user record
 * You can extend the Stack Auth user schema to include a plan field
 */
export async function hasProAccess(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const userId = await getCurrentUserId(ctx);
  if (!userId) return false;
  
  // Check if user record has a plan field (you may need to extend the schema)
  // For now, check the usage table which has planType
  const usage = await ctx.db
    .query("usage")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  
  return usage?.planType === "pro";
}

/**
 * Legacy compatibility: Get user ID (now just returns Stack Auth user ID)
 * @deprecated Use getCurrentUserId instead
 */
export async function getCurrentUserClerkId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  return getCurrentUserId(ctx);
}
