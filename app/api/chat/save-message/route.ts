import { createClient } from '@/lib/supabase-server';
import { addMessage, requireAuth } from '@/lib/supabase-operations';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await requireAuth();
    const { chatId, content, role } = await request.json();
    
    // Validate chat ID format (UUID)
    const isValidChatId = chatId && chatId.length > 10;
    
    if (!isValidChatId) {
      return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
    }

    // Save the message to Supabase
    await addMessage(chatId, role, content);

    return NextResponse.json({ message: 'Message saved' }, { status: 200 });

  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
} 