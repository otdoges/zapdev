import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { autumn } from "./autumn";

/**
 * Get the current authenticated user's Clerk ID from the auth token
 */
export async function getCurrentUserClerkId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Clerk stores the user ID in the subject field
  return identity.subject;
}

/**
 * Get the current authenticated user's Clerk ID or throw an error
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const userId = await getCurrentUserClerkId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Check if user has pro access based on Autumn subscription
 * This checks if the user has access to pro-tier features
 */
export async function hasProAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  customerId?: string
): Promise<boolean> {
  try {
    // Check if user has access to a pro feature
    // Using "pro" as the feature ID to check for pro-tier access
    const { data, error } = await autumn.check(ctx, {
      featureId: "pro",
    });

    if (error) {
      console.error("Error checking pro access:", error);
      return false;
    }

    return data?.allowed ?? false;
  } catch (error) {
    console.error("Exception checking pro access:", error);
    return false;
  }
}
