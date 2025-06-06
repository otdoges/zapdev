import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper function to create Supabase admin client with service role key
const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables for admin operations');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

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
    return new Response('Error verifying webhook', {
      status: 400,
    });
  }

  // Get the ID and type
  const eventType = evt.type;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ error: 'Could not initialize Supabase client' }, { status: 500 });
  }

  // Handle the event
  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses?.[0]?.email_address;

        // Create user in Supabase
        const { error } = await supabase.from('users').insert({
          clerk_user_id: id,
          email: primaryEmail,
          first_name: first_name || null,
          last_name: last_name || null,
          avatar_url: image_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        break;
      }
      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses?.[0]?.email_address;

        // Update user in Supabase
        const { error } = await supabase
          .from('users')
          .update({
            email: primaryEmail,
            first_name: first_name || null,
            last_name: last_name || null,
            avatar_url: image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', id);

        if (error) throw error;
        break;
      }
      case 'user.deleted': {
        const { id } = evt.data;

        // Delete user in Supabase
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('clerk_user_id', id);

        if (error) throw error;
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
} 