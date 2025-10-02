import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  // Get the Svix headers for webhook verification
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

    // Get the primary email address
    const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id);

    if (!primaryEmail) {
      return new Response('No primary email found', { status: 400 });
    }

    try {
      // Sync user to Convex database
      await convex.mutation(api.users.syncUser, {
        userId: id,
        email: primaryEmail.email_address,
        fullName: first_name && last_name ? `${first_name} ${last_name}` : undefined,
        avatarUrl: image_url,
        username: username ?? undefined,
      });

      console.log(`User ${eventType === 'user.created' ? 'created' : 'updated'}:`, id);
    } catch (error) {
      console.error(`Error syncing user to Convex:`, error);
      return new Response('Error syncing user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // Delete user from Convex database
      await convex.mutation(api.users.deleteUser, {
        userId: id!,
      });

      console.log('User deleted:', id);
    } catch (error) {
      console.error('Error deleting user from Convex:', error);
      return new Response('Error deleting user', { status: 500 });
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
}
