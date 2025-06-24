import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getMessagesByChatId, getChatById, requireAuth } from '@/lib/supabase-operations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const user = await requireAuth();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Verify the chat exists and belongs to the user
    const chat = await getChatById(chatId);
    
    if (!chat) {
      // If chat doesn't exist, it's a new chat. Return empty messages.
      return NextResponse.json({ messages: [], chatId });
    }

    if (chat.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to chat' }, { status: 403 });
    }

    // Fetch messages for the chat
    const messages = await getMessagesByChatId(chatId);

    return NextResponse.json({ 
      messages,
      chatId: chat.id,
      chatTitle: chat.title
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch messages' 
    }, { status: 500 });
  }
} 