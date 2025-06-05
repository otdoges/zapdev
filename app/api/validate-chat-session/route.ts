import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js'; // Standard Supabase import

// Initialize Supabase client
// Ensure your Supabase URL and anon key are set in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set.');
  // Potentially throw an error or handle this case as appropriate for your app
}
if (!supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
  // Potentially throw an error or handle this case as appropriate for your app
}

// Create a new Supabase client instance for each request or reuse a global one if preferred
// For server-side, creating per request or using a service role key might be more appropriate
// depending on your RLS policies and security model.
// This example uses the public anon key, assuming RLS is set up for user-specific access.
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client not initialized. Check server logs.' }, { status: 500 });
  }

  try {
    const { userId: authUserId } = getAuth(req);
    const { chatId, userId: clientUserId } = await req.json();

    if (!authUserId) {
      return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
    }

    // Ensure the userId from the client matches the authenticated user's ID
    if (authUserId !== clientUserId) {
      return NextResponse.json({ error: 'User ID mismatch.' }, { status: 403 });
    }

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required.' }, { status: 400 });
    }

    // Query Supabase to check if the chat session exists and belongs to the user
    // Assuming you have a 'chats' table with 'id' (for chatId) and 'user_id' columns
    const { data, error } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', authUserId)
      .single(); // .single() expects one row or null

    if (error && error.code !== 'PGRST116') { // PGRST116: Row to be returned was not found
      console.error('Supabase error validating chat session:', error);
      return NextResponse.json({ error: 'Error validating session with database.' }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({ isValid: true });
    } else {
      return NextResponse.json({ isValid: false });
    }

  } catch (error) {
    console.error('Error in /api/validate-chat-session:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
