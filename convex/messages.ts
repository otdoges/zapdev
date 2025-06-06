import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List messages for the current authenticated user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    
    // Use the user's tokenIdentifier to filter messages
    // This is typically in the format of "clerk:user_id"
    const tokenIdentifier = identity.tokenIdentifier;
    
    return await ctx.db
      .query("authMessages")
      .filter((q) => q.eq(q.field("author"), tokenIdentifier))
      .order("desc")
      .collect();
  },
});

// Create a new message
export const create = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    
    const { content } = args;
    const tokenIdentifier = identity.tokenIdentifier;
    
    return await ctx.db.insert("authMessages", {
      content,
      author: tokenIdentifier,
      authorName: identity.name || "Anonymous",
      authorEmail: identity.email || undefined,
      createdAt: Date.now(),
    });
  },
}); 