import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Get the current authenticated user's ID from Convex Auth
 * Convex Auth automatically sets ctx.auth when a user is authenticated
 */
export async function getCurrentUserId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  // Get user ID from Convex auth context
  // Returns the user's unique ID from the auth system
  return (await ctx.auth.getUserIdentity())?.tokenIdentifier ?? null;
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
 * Checks for active subscription with Pro or Enterprise tier
 */
export async function hasProAccess(
  ctx: QueryCtx | MutationCtx,
  userId?: string
): Promise<boolean> {
  // If userId is not provided, try to get it from auth context
  const targetUserId = userId ?? (await getCurrentUserId(ctx));
  if (!targetUserId) return false;
  
  // Check active subscription
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .first();
  
  // Pro access if active subscription exists with pro or enterprise plan
  if (subscription && (subscription.plan === "pro" || subscription.plan === "enterprise")) {
    return true;
  }
  
  // Fallback to legacy usage table check for backwards compatibility
  const usage = await ctx.db
    .query("usage")
    .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
    .first();
  
  return usage?.planType === "pro";
}

/**
 * Legacy compatibility: Get user ID (now just returns Convex Auth user ID)
 * @deprecated Use getCurrentUserId instead
 */
export async function getCurrentUserClerkId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  return getCurrentUserId(ctx);
}

/**
 * Get the current authenticated user's data from Convex Auth
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  return await ctx.auth.getUserIdentity();
}
