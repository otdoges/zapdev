import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getMessagesByChatId, getMessagesByChatIdPaginated, getChatById, requireAuth } from '@/lib/supabase-operations';
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
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const cursor = searchParams.get('cursor'); // ISO timestamp for cursor-based pagination

    errorLogger.info(
      ErrorCategory.API,
      'Messages API: Fetching messages for chatId:',
      chatId,
      'userId:',
      user.id,
      'pageSize:',
      pageSize,
      'cursor:',
      cursor
    );

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Validate pageSize
    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json({ error: 'Page size must be between 1 and 100' }, { status: 400 });
    }

    // Handle 'new' or 'default' chat IDs
    if (chatId === 'new' || chatId === 'default') {
      errorLogger.info(
        ErrorCategory.API,
        'Messages API: New/default chat, returning empty messages'
      );
      // Return paginated format if pageSize is specified
      if (searchParams.has('pageSize')) {
        return NextResponse.json({ 
          messages: [], 
          chatId: null,
          hasMore: false,
          nextCursor: undefined,
          totalCount: 0
        });
      }
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

    // Check if pagination is requested
    if (searchParams.has('pageSize')) {
      // Use paginated fetching
      const paginatedResult = await getMessagesByChatIdPaginated(chatId, pageSize, cursor || undefined);

      errorLogger.info(
        ErrorCategory.API,
        'Messages API: Found',
        paginatedResult.messages.length,
        'messages (paginated) for chatId:',
        chatId,
        'hasMore:',
        paginatedResult.hasMore,
        'totalCount:',
        paginatedResult.totalCount
      );

      return NextResponse.json({
        messages: paginatedResult.messages,
        chatId: chat.id,
        chatTitle: chat.title,
        hasMore: paginatedResult.hasMore,
        nextCursor: paginatedResult.nextCursor,
        totalCount: paginatedResult.totalCount,
      });
    } else {
      // Use legacy non-paginated fetching for backwards compatibility
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
    }
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
