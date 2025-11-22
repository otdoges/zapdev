import { query } from "./_generated/server";
import { getCurrentUserId } from "./helpers";

/**
 * Get the current authenticated user's ID
 * Used by actions to get the user ID since ctx.auth.getUserIdentity()
 * doesn't work reliably in actions on some platforms
 */
export const getAuthUserId = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUserId(ctx);
  },
});


