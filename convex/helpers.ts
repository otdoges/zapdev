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
 */
export async function hasProAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<boolean> {
  const subscription = await autumn.query(ctx, {});

  // Check if user has an active pro subscription
  // This covers both "pro" and "pro_annual" product IDs
  const productId = subscription?.data?.product?.id;
  return productId === "pro" || productId === "pro_annual";
}
