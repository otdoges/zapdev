import { QueryCtx, MutationCtx } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Get the current authenticated user's ID from Better Auth
 */
export async function getCurrentUserId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) return null;
  return user.userId || user._id.toString();
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
 * You can extend the Better Auth user schema to include a plan field
 */
export async function hasProAccess(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) return false;
  
  const userId = user.userId || user._id.toString();
  
  // Check if user record has a plan field (you may need to extend the schema)
  // For now, check the usage table which has planType
  const usage = await ctx.db
    .query("usage")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  
  return usage?.planType === "pro";
}

/**
 * Legacy compatibility: Get Clerk-style user ID (now just returns Better Auth user ID)
 * @deprecated Use getCurrentUserId instead
 */
export async function getCurrentUserClerkId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  return getCurrentUserId(ctx);
}
