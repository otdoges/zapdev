import { groqProvider } from '@/lib/groq/provider';
import { streamObject } from 'ai';
import { z } from 'zod';
import { buildSystemMessage } from '@/lib/groq/responses';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';
import { createUserFriendlyError } from '@/lib/user-friendly-errors';
import { chatApiLimiter, checkRateLimit } from '@/lib/rate-limiter';
import { validateChatInput } from '@/lib/api-validation';

export const runtime = 'edge';

const responseSchema = z.object({
  steps: z.array(
    z.object({
      type: z.enum(['thought', 'code', 'solution', 'error']),
      content: z.string(),
    })
  ),
});

export async function POST(_request: Request) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(chatApiLimiter);
    if (!rateLimitResult.success) {
      const error = createUserFriendlyError(
        new Error('Too many requests'),
        ErrorCategory.RATE_LIMIT,
        {
          retryAfter: rateLimitResult.reset
        }
      );
      return new Response(JSON.stringify({ error: error.userMessage }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.reset)
        }
      });
    }

    // Validate input
    const validationResult = await validateChatInput(_request);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: validationResult.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { messages, modelId = 'gemma-7b-it' } = validationResult.data;

    errorLogger.info(ErrorCategory.AI_MODEL, 'Chat API request received', {
      modelId,
      messageCount: messages.length
    });

    const provider = groqProvider({
      modelId: modelId,
      headers: {
        'X-Request-ID': crypto.randomUUID()
      }
    });

    const systemMessage = buildSystemMessage({ isAdmin: false });

    const result = await streamObject({
      model: provider,
      messages: [{ role: 'system', content: systemMessage }, ...messages],
      schema: responseSchema,
      onFinish: ({ usage }) => {
        errorLogger.info(ErrorCategory.AI_MODEL, 'Chat API response completed', {
          modelId,
          tokensUsed: usage
        });
      }
    });

    return result.toTextStreamResponse();
  } catch (error) {
    errorLogger.error(ErrorCategory.AI_MODEL, 'Chat API error', error);
    
    const userError = createUserFriendlyError(
      error instanceof Error ? error : new Error('Unknown error'),
      ErrorCategory.AI_MODEL
    );
    
    return new Response(
      JSON.stringify({ error: userError.userMessage }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
