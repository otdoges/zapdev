import { v } from "convex/values";
import { httpAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/clerk-sdk-node";

// Secure webhook handler that verifies the request signature
export const fulfill = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not defined");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Verify the webhook signature
  const payload = await request.text();
  const headersList = request.headers;
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  // If there are missing headers, return a 400
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Create a new SVIX webhook instance with the webhook secret
  const webhook = new Webhook(webhookSecret);
  
  let event: WebhookEvent;
  try {
    // Verify the webhook payload with the headers
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  // Get the ID and type from the event
  const { id } = event.data;
  const eventType = event.type;

  if (!id) {
    return new Response("Missing user ID in webhook event", { status: 400 });
  }

  // Handle the different event types
  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const attributes = event.data;
      // Sync the user with our database
      await ctx.runMutation(internal.clerk.syncUser, {
        clerkId: id,
        email: attributes.email_addresses?.[0]?.email_address,
        firstName: attributes.first_name ?? undefined,
        lastName: attributes.last_name ?? undefined,
        avatarUrl: attributes.image_url,
      });
    } else if (eventType === "user.deleted") {
      // Delete the user from our database
      await ctx.runMutation(internal.clerk.deleteUser, { clerkId: id });
    }
    // Add other event types as needed

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error(`Error processing ${eventType} webhook:`, err);
    return new Response(`Error processing webhook: ${err instanceof Error ? err.message : "Unknown error"}`, {
      status: 500,
    });
  }
});

// Internal mutation to sync a user from Clerk to our database
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

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

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

// Internal mutation to delete a user and all their data
export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      console.warn(`User not found for deletion: ${args.clerkId}`);
      return; // Nothing to delete
    }

    // 1. Find all chats for this user
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (chats.length === 0) {
      // No chats, just delete the user
      await ctx.db.delete(user._id);
      return;
    }

    // 2. For each chat, collect all its message documents
    const messagesToDelete = await Promise.all(
      chats.map((chat) =>
        ctx.db
          .query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
          .collect()
      )
    );

    // 3. Batch delete all messages and all chats in parallel
    await Promise.all([
      ...messagesToDelete.flat().map((msg) => ctx.db.delete(msg._id)),
      ...chats.map((chat) => ctx.db.delete(chat._id)),
    ]);

    // 4. Finally, delete the user
    await ctx.db.delete(user._id);
  },
}); 