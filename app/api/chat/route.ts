import { streamOpenRouterResponse, getMultiModelResponses, getTokenUsageStats } from '@/lib/openrouter';
import { auth } from '@clerk/nextjs/server';
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { messages, modelId, chatId, useMultipleModels = false } = await req.json();
    
    const { userId } = await auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check token usage before proceeding
    const tokenStats = getTokenUsageStats();
    if (tokenStats.percentage > 90) {
      return new Response(
        JSON.stringify({ 
          error: 'Token limit nearly reached', 
          usage: tokenStats 
        }), 
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create or ensure chat exists in Convex
    let finalChatId = null;
    
    // Check if chatId is a valid Convex ID format or a UUID
    const isValidConvexId = chatId && !chatId.includes('-') && chatId.length > 10;
    
    if (chatId && isValidConvexId) {
      // It's already a valid Convex ID
      finalChatId = chatId;
    } else {
      // Either no chatId or it's a UUID, create a new chat in Convex
      try {
        const title = messages.length > 0 
          ? messages[0].content?.slice(0, 50) + '...' 
          : 'New Chat';
        
        // For now, we'll skip Convex chat creation until user management is properly set up
        console.log('Would create chat with title:', title, 'for user:', userId);
        // finalChatId will remain null, which is handled gracefully
      } catch (error) {
        console.error('Failed to create chat in Convex:', error);
        // Continue without chat ID for now
      }
    }

    // Use multiple models if requested
    if (useMultipleModels) {
      try {
        const multiModelResponses = await getMultiModelResponses({
          chatHistory: messages,
          primaryModelId: modelId,
          maxTokens: 1024
        });

        // Return the best response (first successful one)
        const bestResponse = multiModelResponses.find(r => r.success);
        if (bestResponse && bestResponse.response) {
          // Message saving disabled for now until user management is set up
          console.log('Would save messages to Convex chat:', finalChatId);

          return new Response(
            JSON.stringify({
              response: bestResponse.response,
              modelUsed: bestResponse.modelName,
              chatId: finalChatId,
              tokenUsage: getTokenUsageStats(),
              alternatives: multiModelResponses.filter(r => r.success && r !== bestResponse)
            }),
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } else {
          throw new Error('All models failed to generate response');
        }
      } catch (error) {
        console.error('Multi-model generation failed, falling back to single model:', error);
        // Fall back to single model
      }
    }

    // Message saving disabled for now
    console.log('Would save user message to Convex chat:', finalChatId);

    // Single model response (default)
    const result = await streamOpenRouterResponse({
      chatHistory: messages,
      modelId,
      maxTokens: 1024 // Conservative limit
    });

    // Return the stream response
    const response = result.toDataStreamResponse();
    
    // Add chat ID to response headers if available
    if (finalChatId) {
      response.headers.set('X-Chat-ID', finalChatId.toString());
    }

    return response;

  } catch (error) {
    console.error('Error in chat API:', error);
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response('An unknown error occurred', { status: 500 });
  }
} 