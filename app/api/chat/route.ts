import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createChat, addMessage } from '@/lib/supabase-operations';
import { streamGroqResponse } from '@/lib/groq-provider';

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

    // 3. Generate AI response using Groq
    try {
      const result = await streamGroqResponse({
        chatHistory: messages,
        modelId: 'qwen3-32b', // Switched to Qwen3-32B model as requested
        temperature: 0.7,
        maxTokens: 2048,
      });

      // 4. Create a readable stream to return the response
      const encoder = new TextEncoder();
      let fullResponse = '';

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.textStream) {
              fullResponse += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
            
            // 5. Save the complete AI response to database
            if (finalChatId && fullResponse) {
              try {
                await addMessage(finalChatId, 'assistant', fullResponse);
              } catch (saveError) {
                console.error('Error saving AI message to database:', saveError);
              }
            }
            
            controller.close();
          } catch (error) {
            console.error('Error during response stream:', error);
            controller.error(error);
          }
        },
      });

      const headers = new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      
      if (finalChatId) {
        headers.set('X-Chat-ID', finalChatId);
      }
      
      return new Response(stream, {
        status: 200,
        headers,
      });

    } catch (groqError) {
      console.error('Groq API error:', groqError);
      
      // Fallback response if Groq fails
      const fallbackMessage = "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment.";
      
      if (finalChatId) {
        try {
          await addMessage(finalChatId, 'assistant', fallbackMessage);
        } catch (saveError) {
          console.error('Error saving fallback message:', saveError);
        }
      }
      
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable', 
        message: fallbackMessage 
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to process chat message', 
      details: errorMessage 
    }, { status: 500 });
  }
} 