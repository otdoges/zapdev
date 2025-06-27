import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getMessagesByChatId, getChatById, requireAuth } from '@/lib/supabase-operations';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const user = await requireAuth();

    if (!user) {
      errorLogger.info(ErrorCategory.API, 'Messages API: No authenticated user');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    errorLogger.info(
      ErrorCategory.API,
      'Messages API: Fetching messages for chatId:',
      chatId,
      'userId:',
      user.id
    );

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Handle 'new' or 'default' chat IDs
    if (chatId === 'new' || chatId === 'default') {
      errorLogger.info(
        ErrorCategory.API,
        'Messages API: New/default chat, returning empty messages'
      );
      return NextResponse.json({ messages: [], chatId: null });
    }

    // Verify the chat exists and belongs to the user
    const chat = await getChatById(chatId);

    if (!chat) {
      errorLogger.info(ErrorCategory.API, 'Messages API: Chat not found for ID:', chatId);
      // If chat doesn't exist, it's a new chat. Return empty messages.
      return NextResponse.json({ messages: [], chatId: null });
    }

    if (chat.user_id !== user.id) {
      errorLogger.info(
        ErrorCategory.API,
        'Messages API: Unauthorized access attempt. Chat user_id:',
        chat.user_id,
        'Request user_id:',
        user.id
      );
      return NextResponse.json({ error: 'Unauthorized access to chat' }, { status: 403 });
    }

    // Fetch messages for the chat
    const messages = await getMessagesByChatId(chatId);

    errorLogger.info(
      ErrorCategory.API,
      'Messages API: Found',
      messages.length,
      'messages for chatId:',
      chatId
    );

    return NextResponse.json({
      messages,
      chatId: chat.id,
      chatTitle: chat.title,
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Error fetching chat messages:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
