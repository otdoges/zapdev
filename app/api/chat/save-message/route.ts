import { createClient } from '@/lib/supabase-server';
import { addMessage, requireAuth, getChatById } from '@/lib/supabase-operations';
import { NextRequest, NextResponse } from 'next/server';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export async function POST(request: NextRequest) {
  try {
    await createClient(); // Initialize supabase client for authentication

    // Check if user is authenticated
    const user = await requireAuth();

    if (!user) {
      errorLogger.info(ErrorCategory.API, 'Save message: No authenticated user');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { chatId, content, role } = await request.json();

    errorLogger.info(
      ErrorCategory.API,
      'Save message: Attempting to save message for chatId:',
      chatId,
      'role:',
      role
    );

    // Validate required fields
    if (!chatId || !content || !role) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: { chatId: !!chatId, content: !!content, role: !!role },
        },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        {
          error: 'Invalid role. Must be "user" or "assistant"',
        },
        { status: 400 }
      );
    }

    // Validate chat ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(chatId)) {
      errorLogger.info(ErrorCategory.API, 'Save message: Invalid chat ID format:', chatId);
      return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
    }

    // Verify the chat exists and belongs to the user
    const chat = await getChatById(chatId);

    if (!chat) {
      errorLogger.info(ErrorCategory.API, 'Save message: Chat not found for ID:', chatId);
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.user_id !== user.id) {
      errorLogger.info(
        ErrorCategory.API,
        'Save message: Unauthorized access attempt. Chat user_id:',
        chat.user_id,
        'Request user_id:',
        user.id
      );
      return NextResponse.json({ error: 'Unauthorized access to chat' }, { status: 403 });
    }

    // Save the message to Supabase
    const savedMessage = await addMessage(chatId, role, content);

    errorLogger.info(
      ErrorCategory.API,
      'Save message: Message saved successfully with ID:',
      savedMessage.id
    );

    return NextResponse.json(
      {
        message: 'Message saved',
        messageId: savedMessage.id,
      },
      { status: 200 }
    );
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Error saving message:', error);
    return NextResponse.json(
      {
        error: 'Failed to save message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
