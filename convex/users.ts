import { query } from "./_generated/server";
import { getCurrentUserId, getCurrentUser as getUserIdentity } from "./helpers";

/**
 * Get the current user's information
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    
    // Get user identity from auth
    const identity = await getUserIdentity(ctx);
    if (!identity) return null;
    
    // Return user data compatible with client hooks
    return {
      tokenIdentifier: userId,
      email: identity.email,
      name: identity.name,
      image: identity.pictureUrl,
    };
  },
});
