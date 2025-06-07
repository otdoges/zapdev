import { streamOpenRouterResponse } from '@/lib/openrouter';
import { enhancePromptWithGemini } from '@/lib/gemini';
import { type NextRequest } from 'next/server';

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

// Check for OpenRouter API key
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY is not set. API calls may fail.');
}

export async function POST(req: NextRequest) {
  try {
    // Extract the `messages`, `modelId`, and `useThinking` from the body
    const { messages = [], modelId, useThinking = false } = await req.json();
const safeModelId = modelId && typeof modelId === 'string' ? modelId : 'openrouter/auto';
    
    // Get the last user message to potentially enhance it
    const lastUserMessage = messages.findLast((msg: any) => msg.role === 'user');
    
    let processedMessages = [...messages];
    
    // If there's a user message and it contains design-related content, enhance it
    if (lastUserMessage) {
      const isDesignPrompt = /design|UI|interface|layout|website|page|component|style|color|theme/i.test(lastUserMessage.content);
      
      if (isDesignPrompt) {
        try {
          const enhancedPrompt = await enhancePromptWithGemini(lastUserMessage.content);
          
          processedMessages = [
            ...messages.slice(0, -1),
            {
              role: 'system',
              content: `The following is an enhanced version of the user's prompt created by Gemini. Use this enhanced prompt to generate better UI design advice and code.`
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ];
        } catch (error) {
          console.error('Error enhancing prompt:', error);
          // Continue with original messages on error
        }
      }
    }

    // Get the result from our utility function
    const result = await streamOpenRouterResponse({
      chatHistory: processedMessages,
      modelId,
      useThinking,
    });

    // Return a text stream response that properly formats the text for the client
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error in chat API route:', error);
    let errorMessage = 'There was an error processing your request.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 