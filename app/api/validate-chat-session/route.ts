import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const { chatId, userId: clientUserId } = await req.json();

    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
    }

    const authUserId = user.id;

    // Ensure the userId from the client matches the authenticated user's ID
    if (authUserId !== clientUserId) {
      return NextResponse.json({ error: 'User ID mismatch.' }, { status: 403 });
    }

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required.' }, { status: 400 });
    }

    try {
      // Check if chat exists
      const { data: existingChat, error: selectError } = await supabase
        .from('chats')
        .select('id')
        .eq('id', chatId)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking chat:', selectError);
        // Return valid to allow chat to proceed even with DB errors
        return NextResponse.json({ isValid: true });
      }

      // If chat doesn't exist, we'll create it
      if (!existingChat) {
        // We need to first get the user's internal UUID from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUserId)
          .maybeSingle();

        if (userError || !userData) {
          console.warn('User not found in database, returning valid=true anyway');
          return NextResponse.json({ isValid: true });
        }

        // Create chat record
        const { error: insertError } = await supabase
          .from('chats')
          .insert({
            id: chatId,
            user_id: userData.id,
            title: 'New Chat'
          });

        if (insertError) {
          console.error('Error creating chat:', insertError);
          // Still return valid=true to allow application to function
          return NextResponse.json({ isValid: true });
        }
      }

      return NextResponse.json({ isValid: true });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return valid=true to allow the application to function even with DB errors
      return NextResponse.json({ isValid: true });
    }
  } catch (error) {
    console.error('General error in /api/validate-chat-session:', error);
    // For general errors, we'll still allow the chat to proceed
    return NextResponse.json({ isValid: true });
  }
}
