import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createChat, addMessage } from '@/lib/supabase-operations';
import { streamText } from 'ai';
import { groqProvider } from '@/lib/groq-provider';
import { withRateLimit, RateLimitConfigs } from '@/lib/rate-limiter';
import { withValidation, ApiSchemas, z } from '@/lib/api-validation';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';
import { getUserFriendlyError } from '@/lib/user-friendly-errors';

// Custom validation schema for chat endpoint
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(10000),
      })
    )
    .min(1),
  chatId: z.string().optional(),
  modelId: z
    .enum([
      'llama-3.3-70b-versatile', 
      'llama-3.1-8b-instant', 
      'mixtral-8x7b-32768',
      'deepseek-r1-distill-qwen-32b',
      'qwen-qwq-32b',
      'gemma2-9b-it'
    ])
    .optional(),
  useReasoning: z.boolean().optional(),
  reasoningFormat: z.string().optional(),
});

async function handleChatRequest(
  request: NextRequest,
  context: { body?: z.infer<typeof chatRequestSchema> }
) {
  if (!context.body) {
    return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
  }
  const startTime = Date.now();

  try {
    // Authentication with better error handling
    let user;
    try {
      user = await requireAuth();
    } catch (authError) {
      errorLogger.logAuthError('chat_api_auth', authError);
      const friendlyError = getUserFriendlyError(authError, 'auth/session-expired');

      return NextResponse.json(
        {
          error: friendlyError.title,
          message: friendlyError.message,
          suggestion: friendlyError.suggestion,
        },
        { status: 401 }
      );
    }

    const { messages, chatId, modelId, useReasoning, reasoningFormat } = context.body;
    let finalChatId = chatId;

    // 1. Ensure a chat exists
    if (!finalChatId || finalChatId === 'new') {
      try {
        const firstMessage = messages[0]?.content || 'New Chat';
        const newChat = await createChat(user.id, firstMessage.substring(0, 50));
        finalChatId = newChat.id;

        errorLogger.info(ErrorCategory.API, 'New chat created', {
          userId: user.id,
          chatId: finalChatId,
        });
      } catch (dbError) {
        errorLogger.error(ErrorCategory.DATABASE, 'Failed to create chat', dbError, {
          userId: user.id,
        });

        const friendlyError = getUserFriendlyError(dbError, 'db/save-failed');
        return NextResponse.json(
          {
            error: friendlyError.title,
            message: friendlyError.message,
            suggestion: friendlyError.suggestion,
          },
          { status: 500 }
        );
      }
    }

    // 2. Save the user's message
    const userMessage = messages[messages.length - 1];
    if (userMessage?.role === 'user') {
      try {
        await addMessage(finalChatId, 'user', userMessage.content);
      } catch (dbError) {
        errorLogger.warning(ErrorCategory.DATABASE, 'Failed to save user message', dbError, {
          userId: user.id,
          chatId: finalChatId,
        });
        // Continue processing even if save fails
      }
    }

    // 3. Generate AI response using Groq with proper Vercel AI SDK
    try {
      const model = groqProvider.chat(modelId || 'llama-3.3-70b-versatile');

      const result = await streamText({
        model: model as any,
        messages,
        temperature: 0.7,
        maxTokens: 2048,
        onFinish: async ({ text, usage, finishReason }) => {
          // Log AI completion metrics
          const duration = Date.now() - startTime;
          errorLogger.info(ErrorCategory.AI_MODEL, 'AI completion successful', {
            userId: user.id,
            chatId: finalChatId,
            model: modelId || 'llama-3.3-70b-versatile',
            promptTokens: usage?.promptTokens,
            completionTokens: usage?.completionTokens,
            totalTokens: usage?.totalTokens,
            finishReason,
            duration,
          });

          // Save the AI response after streaming completes
          if (finalChatId && text) {
            try {
              await addMessage(finalChatId, 'assistant', text);
            } catch (saveError) {
              errorLogger.warning(ErrorCategory.DATABASE, 'Failed to save AI message', saveError, {
                userId: user.id,
                chatId: finalChatId,
              });
            }
          }
        },
      });

      // Return the properly formatted data stream response with chat ID header
      const streamResponse = result.toDataStreamResponse();
      streamResponse.headers.set('X-Chat-ID', finalChatId);

      // Convert to NextResponse
      return new NextResponse(streamResponse.body, {
        status: streamResponse.status,
        statusText: streamResponse.statusText,
        headers: streamResponse.headers,
      });
    } catch (groqError) {
      errorLogger.logAiError(modelId || 'llama-3.3-70b-versatile', 'stream_text', groqError, {
        userId: user.id,
        chatId: finalChatId,
        messageCount: messages.length,
      });

      // User-friendly error for AI failures
      const friendlyError = getUserFriendlyError(groqError, 'ai/generation-failed');

      // Fallback response if Groq fails
      if (finalChatId) {
        try {
          await addMessage(finalChatId, 'assistant', friendlyError.message);
        } catch (saveError) {
          errorLogger.warning(ErrorCategory.DATABASE, 'Failed to save fallback message', saveError);
        }
      }

      return NextResponse.json(
        {
          error: friendlyError.title,
          message: friendlyError.message,
          suggestion: friendlyError.suggestion,
          chatId: finalChatId,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    errorLogger.critical(ErrorCategory.API, 'Unexpected chat API error', error, {
      endpoint: '/api/chat',
      method: 'POST',
      duration,
    });

    const friendlyError = getUserFriendlyError(error);
    return NextResponse.json(
      {
        error: friendlyError.title,
        message: friendlyError.message,
        suggestion: friendlyError.suggestion,
      },
      { status: 500 }
    );
  }
}

// Export the POST handler with rate limiting and validation
export const POST = withRateLimit(
  withValidation(handleChatRequest, {
    body: chatRequestSchema,
  }),
  RateLimitConfigs.AI_ENDPOINTS
);
