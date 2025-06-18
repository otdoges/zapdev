import { streamOpenRouterResponse, getMultiModelResponses, getTokenUsageStats } from '@/lib/openrouter';
import { auth } from '@/lib/auth';
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { messages, modelId, chatId, useMultipleModels = false } = await req.json();
    
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // Check token usage before proceeding
    const tokenStats = getTokenUsageStats();
    if (tokenStats.percentage > 95) {
      return new Response(
        JSON.stringify({ 
          error: 'Token limit reached. Please try again later.', 
          usage: tokenStats 
        }), 
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Ensure we have a valid chat ID
    let finalChatId = chatId;
    
    // Validate if it's a proper Convex ID format
    const isValidConvexId = chatId && !chatId.includes('-') && chatId.length > 10;
    
    if (!isValidConvexId) {
      // Create a new chat in Convex
      try {
        const title = messages.length > 0 
          ? messages[0].content?.slice(0, 50) + '...' 
          : 'New Chat';
        
        finalChatId = await convex.mutation(api.chats.createChat, {
          userId: userId as any,
          title
        });
        
        console.log('Created new chat:', finalChatId);
      } catch (error) {
        console.error('Failed to create chat in Convex:', error);
        // Continue without chat ID for now
      }
    }

    // Save user message to Convex if we have a valid chat ID
    if (finalChatId && messages.length > 0) {
      try {
        const userMessage = messages[messages.length - 1];
        if (userMessage.role === 'user') {
          await convex.mutation(api.chats.addMessage, {
            chatId: finalChatId,
            content: userMessage.content,
            role: 'user'
          });
        }
      } catch (error) {
        console.error('Failed to save user message:', error);
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

        // Get the best response (first successful one)
        const bestResponse = multiModelResponses.find(r => r.success);
        if (bestResponse && bestResponse.response) {
          // Save AI response to Convex
          if (finalChatId) {
            try {
              await convex.mutation(api.chats.addMessage, {
                chatId: finalChatId,
                content: bestResponse.response,
                role: 'assistant'
              });
            } catch (error) {
              console.error('Failed to save AI response:', error);
            }
          }

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

    // Single model streaming response
    const result = await streamOpenRouterResponse({
      chatHistory: messages,
      modelId,
      maxTokens: 1024
    });

    // Create a transform stream to intercept and save the response
    let fullResponse = '';
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        fullResponse += text;
        controller.enqueue(chunk);
      },
      flush() {
        // Save the complete AI response to Convex when streaming is done
        if (finalChatId && fullResponse.trim()) {
          convex.mutation(api.chats.addMessage, {
            chatId: finalChatId,
            content: fullResponse,
            role: 'assistant'
          }).catch(error => {
            console.error('Failed to save streamed response:', error);
          });
        }
      }
    });

    // Get the stream response and pipe through our transform
    const streamResponse = result.toDataStreamResponse();
    
    // Add chat ID to response headers if available
    const headers = new Headers(streamResponse.headers);
    if (finalChatId) {
      headers.set('X-Chat-ID', finalChatId.toString());
    }
    
    // Add thinking indicator headers for real-time display
    headers.set('X-Thinking', 'true');
    headers.set('X-Model', modelId || 'auto');

    return new Response(streamResponse.body?.pipeThrough(new TransformStream()), {
      headers,
      status: streamResponse.status
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: 'An unknown error occurred' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 