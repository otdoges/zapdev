import { QueryCtx, MutationCtx } from "./_generated/server";

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
 * Check if user has pro access based on Clerk custom claims
 */
export function hasProAccess(identity: any): boolean {
  // Clerk stores custom claims in tokenIdentifier or custom claims
  // You'll need to check the specific structure from your Clerk JWT
  const plan = identity?.plan || identity?.publicMetadata?.plan;
  return plan === "pro";
}
