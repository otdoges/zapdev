import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createChat, addMessage } from '@/lib/supabase-operations';
import { streamText } from 'ai';
import { groqProvider } from '@/lib/groq-provider';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { messages, chatId, modelId, useReasoning, reasoningFormat } = await request.json();
    let finalChatId = chatId;

    // 1. Ensure a chat exists
    if (!finalChatId || finalChatId === 'new') {
      const firstMessage = messages[0]?.content || 'New Chat';
      const newChat = await createChat(user.id, firstMessage.substring(0, 50));
      finalChatId = newChat.id;
    }

    // 2. Save the user's message
    const userMessage = messages[messages.length - 1];
    if (userMessage?.role === 'user') {
      await addMessage(finalChatId, 'user', userMessage.content);
    }

    // 3. Generate AI response using Groq with proper Vercel AI SDK
    try {
      const model = groqProvider.chat(modelId || 'qwen-3-32b');
      
      const result = await streamText({
        model: model as any, // Type assertion to satisfy LanguageModelV1 type
        messages,
        temperature: 0.7,
        maxTokens: 2048,
        onFinish: async ({ text, usage, finishReason }) => {
          // Save the AI response after streaming completes
          if (finalChatId && text) {
            try {
              await addMessage(finalChatId, 'assistant', text);
            } catch (saveError) {
              console.error('Error saving AI message to database:', saveError);
            }
          }
        },
      });

      // Return the properly formatted data stream response with chat ID header
      const response = result.toDataStreamResponse();
      response.headers.set('X-Chat-ID', finalChatId);
      
      return response;

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