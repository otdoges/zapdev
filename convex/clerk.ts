import { v } from "convex/values";
import { internalMutation, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// This internal mutation will be called to sync user data
export const syncUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, email, firstName, lastName, avatarUrl } = args;

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      return await ctx.db.patch(existingUser._id, {
        email,
        firstName, 
        lastName,
        avatarUrl,
        updatedAt: now,
      });
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId,
        email,
        firstName,
        lastName,
        avatarUrl,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// This internal mutation will delete a user
export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const { clerkId } = args;

    // Find user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return null;
    }

    // Find all chats for this user
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Delete all messages in each chat
    for (const chat of chats) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      // Delete the chat
      await ctx.db.delete(chat._id);
    }

    // Delete the user
    return await ctx.db.delete(user._id);
  },
});

export const fulfill = httpAction(async (ctx, request) => {
  const payload = await request.text();
  const headers = request.headers;
  
  try {
    // Parse the webhook payload
    const payloadJson = JSON.parse(payload);
    const event = payloadJson.type;
    const data = payloadJson.data;

    // Ensure we have a valid ID
    if (!data.id) {
      return new Response("Missing ID in webhook data", { status: 400 });
    }

    const userId = data.id as string;

    if (event === "user.created" || event === "user.updated") {
      // Extract user data with safe type handling
      let email: string | undefined;
      if (data.email_addresses && data.email_addresses.length > 0) {
        email = data.email_addresses[0].email_address;
      }

      await ctx.runMutation(internal.clerk.syncUser, {
        clerkId: userId,
        email: email,
        firstName: data.first_name === null ? undefined : data.first_name,
        lastName: data.last_name === null ? undefined : data.last_name,
        avatarUrl: data.image_url || undefined,
      });
    } else if (event === "user.deleted") {
      await ctx.runMutation(internal.clerk.deleteUser, { clerkId: userId });
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response("Error processing webhook", { status: 400 });
  }
}); 