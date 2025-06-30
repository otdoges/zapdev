import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createChat, requireAuth } from '@/lib/supabase-operations';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export async function POST(request: NextRequest) {
  try {
    await createClient(); // Initialize supabase client
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newChat = await createChat(user.id, title);

    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
