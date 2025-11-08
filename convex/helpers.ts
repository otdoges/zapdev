import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { autumn } from "./autumn";

const PRO_FEATURE_ID = process.env.AUTUMN_PRO_FEATURE_ID ?? "pro";

// Cache for pro access checks with TTL (5 minutes)
const PRO_ACCESS_CACHE_TTL_MS = 5 * 60 * 1000;
interface CacheEntry {
  allowed: boolean;
  timestamp: number;
}
const proAccessCache = new Map<string, CacheEntry>();

const reportBillingError = (error: unknown, context: string) => {
  console.error(`[Autumn:${context}]`, error);
};

/**
 * Get cached pro access status if available and not expired
 */
function getCachedProAccess(userId: string): boolean | null {
  const cached = proAccessCache.get(userId);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > PRO_ACCESS_CACHE_TTL_MS) {
    // Cache expired, remove it
    proAccessCache.delete(userId);
    return null;
  }

  return cached.allowed;
}

/**
 * Set cached pro access status
 */
function setCachedProAccess(userId: string, allowed: boolean): void {
  proAccessCache.set(userId, {
    allowed,
    timestamp: Date.now(),
  });
}

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
 *
 * Caches the result for 5 minutes to prevent excessive API calls and race conditions
 */
export async function hasProAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<boolean> {
  try {
    // Get user ID for caching
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const userId = identity.subject ?? identity.tokenIdentifier;
    if (!userId) return false;

    // Check cache first
    const cachedResult = getCachedProAccess(userId);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // Check if user has access to a pro feature
    // Using "pro" as the feature ID to check for pro-tier access
    const { data, error } = await autumn.check(ctx, {
      featureId: PRO_FEATURE_ID,
    });

    if (error) {
      reportBillingError(error, "pro_access_check");
      return false;
    }

    const allowed = data?.allowed ?? false;

    // Cache the result
    setCachedProAccess(userId, allowed);

    return allowed;
  } catch (error) {
    reportBillingError(error, "pro_access_check_exception");
    return false;
  }
}

