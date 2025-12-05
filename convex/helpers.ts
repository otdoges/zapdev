import { ActionCtx, QueryCtx, MutationCtx } from "./_generated/server";

type AuthContext = QueryCtx | MutationCtx | ActionCtx;

interface AuthInfo {
  normalizedUserId: string | null;
  tokenIdentifier: string | null;
  subject: string | null;
}

export async function getAuthInfo(ctx: AuthContext): Promise<AuthInfo> {
  const identity = await ctx.auth.getUserIdentity();
  const tokenIdentifier = identity?.tokenIdentifier ?? null;
  const subject = identity?.subject ?? null;

  return {
    normalizedUserId: tokenIdentifier ?? subject ?? null,
    tokenIdentifier,
    subject,
  };
}

export async function getCurrentUserId(
  ctx: AuthContext
): Promise<string | null> {
  const { normalizedUserId } = await getAuthInfo(ctx);
  return normalizedUserId;
}

/**
 * Get the current authenticated user's ID or throw an error
 */
export async function requireAuth(
  ctx: AuthContext
): Promise<string> {
  const { normalizedUserId } = await getAuthInfo(ctx);
  if (!normalizedUserId) {
    throw new Error("Unauthorized");
  }
  return normalizedUserId;
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

export function isOwner(
  resourceUserId: string | null | undefined,
  authInfo: AuthInfo
): boolean {
  if (!resourceUserId) {
    return false;
  }

  return (
    resourceUserId === authInfo.normalizedUserId ||
    resourceUserId === authInfo.tokenIdentifier ||
    resourceUserId === authInfo.subject
  );
}

/**
 * Get the current authenticated user's data from Convex Auth
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  return await ctx.auth.getUserIdentity();
}
