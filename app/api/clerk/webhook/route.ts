import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function POST(req: NextRequest) {
  // Check if Convex is configured
  if (!convex) {
    console.log('Convex not configured, skipping webhook');
    return new Response('OK', { status: 200 });
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Get the Webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Create a new Svix instance with your webhook secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Clerk webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;
        
        const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
        if (!primaryEmail?.email_address) {
          console.log('No primary email found for user');
          return new Response('OK', { status: 200 });
        }

        const fullName = [first_name, last_name].filter(Boolean).join(' ') || undefined;

        // Store user data temporarily for sync when they first visit
        // We can't directly call Convex mutations from webhooks without user auth
        console.log(`User ${eventType}: ${id}, Email: ${primaryEmail.email_address}`);
        break;
      }
      case 'user.deleted': {
        const { id } = evt.data;
        console.log(`User deleted: ${id}`);
        // Note: We might want to soft-delete or anonymize user data instead
        // For now, we'll leave the Convex data intact for data integrity
        break;
      }
      default:
        console.log(`Unhandled Clerk webhook event: ${eventType}`);
        break;
    }
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return new Response(`Error processing webhook: ${error}`, {
      status: 500,
    });
  }

  return new Response('OK', { status: 200 });
}