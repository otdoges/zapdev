/**
 * This file handles Clerk webhooks for user management.
 * It defines an HTTP action to receive webhook events from Clerk,
 * verifies them, and then calls internal mutations to create,
 * update, or delete users in the database.
 */
import { v } from "convex/values";
import { httpAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/clerk-sdk-node";

// Helper to get environment variables
const getClerkWebhookSecret = () => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("CLERK_WEBHOOK_SECRET environment variable is not set.");
  }
  return secret;
};

// The HTTP action that handles Clerk webhooks
export const clerkWebhook = httpAction(async (ctx, request) => {
  const webhook = new Webhook(getClerkWebhookSecret());
  const payload = await request.text();
  const headers = request.headers;

  let event: WebhookEvent;
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");
  
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing required Svix headers");
    return new Response("Missing webhook headers", { status: 400 });
  }

   event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;

  // Handle the event based on its type
  switch (event.type) {
    case "user.created":
      await ctx.runMutation(internal.users.createUser, {
        clerkId: event.data.id,
        email: event.data.email_addresses[0]?.email_address ?? undefined,
        firstName: event.data.first_name ?? undefined,
        lastName: event.data.last_name ?? undefined,
        avatarUrl: event.data.image_url,
      });
      break;

    case "user.updated":
      await ctx.runMutation(internal.users.updateUser, {
        clerkId: event.data.id,
        email: event.data.email_addresses[0]?.email_address ?? undefined,
        firstName: event.data.first_name ?? undefined,
        lastName: event.data.last_name ?? undefined,
        avatarUrl: event.data.image_url,
      });
      break;

    case "user.deleted":
      // Handle user deletion - don't try to access db directly in httpAction
      if (event.data.id) {
        await ctx.runMutation(internal.users.deleteUser, {
          clerkId: event.data.id,
        });
      } else {
        console.error("Missing Clerk user ID in deletion event");
      }
      break;
    default:
      console.log(`Unhandled Clerk webhook event type: ${event.type}`);
  }

  return new Response(null, { status: 200 });
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