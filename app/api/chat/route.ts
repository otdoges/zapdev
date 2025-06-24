import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createChat, addMessage } from '@/lib/supabase-operations';
import { Readable } from 'stream';

// Helper to get the absolute URL for server-side requests
function getAbsoluteUrl(path: string) {
  const host = process.env.VERCEL_URL || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}${path}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { messages, chatId } = await request.json();
    let finalChatId = chatId;

    // 1. Ensure a chat exists
    if (!finalChatId) {
      const firstMessage = messages[0]?.content || 'New Chat';
      const newChat = await createChat(user.id, firstMessage.substring(0, 50));
      finalChatId = newChat.id;
    }

    // 2. Save the user's message
    const userMessage = messages[messages.length - 1];
    if (userMessage?.role === 'user') {
      await addMessage(finalChatId, 'user', userMessage.content);
    }

    // 3. Delegate to the AI Team Coordinator
    const coordinatorUrl = getAbsoluteUrl('/api/ai-team/coordinate');
    
    const coordinatorResponse = await fetch(coordinatorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, chatId: finalChatId, userId: user.id }),
    });

    if (!coordinatorResponse.ok || !coordinatorResponse.body) {
      const errorBody = await coordinatorResponse.text();
      console.error('AI Coordinator failed:', errorBody);
      return NextResponse.json({ error: 'The AI coordinator failed to respond.' }, { status: 500 });
    }

    // 4. Stream the response back to the client and save the final result
    const reader = coordinatorResponse.body.getReader();
    let fullResponse = '';
    let streamCompletedSuccessfully = false;
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              streamCompletedSuccessfully = true;
              break;
            }
            
            const chunk = new TextDecoder().decode(value);
            fullResponse += chunk;
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Error during response stream:', error);
          streamCompletedSuccessfully = false;
          controller.error(error);
        } finally {
          // 5. Save the complete AI response only if stream completed successfully
          if (streamCompletedSuccessfully && finalChatId && fullResponse) {
            try {
              await addMessage(finalChatId, 'assistant', fullResponse);
            } catch (saveError) {
              console.error('Error saving message to database:', saveError);
            }
          }
          controller.close();
        }
      },
    });

    const headers = new Headers(coordinatorResponse.headers);
    headers.set('X-Chat-ID', finalChatId);
    
    return new Response(stream, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process chat message', details: errorMessage }, { status: 500 });
  }
} 