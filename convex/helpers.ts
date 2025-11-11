import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get the current authenticated user from Better Auth session
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Better Auth stores the user ID in the subject field
  // The subject is the user's ID from the users table
  return identity.subject as Id<"users">;
}

/**
 * Get the current authenticated user or throw an error
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const userId = await getCurrentUser(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Check if user has pro access based on Polar.sh subscription
 */
export async function hasProAccess(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user) return false;

  // Check if user has an active pro subscription
  return user.plan === "pro" && 
         (user.subscriptionStatus === "active" || 
          user.subscriptionStatus === "trialing");
}

/**
 * Get user's plan type
 */
export async function getUserPlan(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<"free" | "pro"> {
  const user = await ctx.db.get(userId);
  if (!user) return "free";
  
  const isPro = await hasProAccess(ctx, userId);
  return isPro ? "pro" : "free";
}
