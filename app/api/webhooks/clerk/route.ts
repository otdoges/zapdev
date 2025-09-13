import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
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

  // Create a new Svix instance with your secret.
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
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Webhook with ID ${body.data.id} and type ${eventType}`);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

    // Get primary email
    const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
    
    if (!primaryEmail) {
      console.error('No primary email found for user:', id);
      return new Response('No primary email', { status: 400 });
    }

    // Create user data for Convex
    const userData = {
      email: primaryEmail.email_address,
      fullName: `${first_name || ''} ${last_name || ''}`.trim() || undefined,
      avatarUrl: image_url || undefined,
      username: username || undefined,
    };

    try {
      // Call our Convex function to upsert the user
      const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/upsertUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CONVEX_DEPLOY_KEY}`,
        },
        body: JSON.stringify({
          args: userData,
          identity: {
            subject: id,
            tokenIdentifier: `${process.env.CLERK_JWT_TEMPLATE_NAME || 'convex'}|${id}`,
          }
        }),
      });

      if (!response.ok) {
        console.error('Failed to upsert user to Convex:', await response.text());
        return new Response('Failed to save user', { status: 500 });
      }

      console.log(`User ${eventType === 'user.created' ? 'created' : 'updated'} successfully:`, id);
    } catch (error) {
      console.error('Error calling Convex:', error);
      return new Response('Failed to save user', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}