import { streamOpenRouterResponse, getMultiModelResponses, getTokenUsageStats } from '@/lib/openrouter';
import { auth } from '@/lib/auth';
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

// Defensive Convex client creation
const createConvexClient = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL not found, using placeholder");
    return new ConvexHttpClient("https://placeholder.convex.cloud");
  }
  return new ConvexHttpClient(convexUrl);
};

const convex = createConvexClient();

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, modelId, chatId, useMultipleModels = false } = await req.json();
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

    // Check if user wants to build something - trigger AI team
    const lastMessage = messages[messages.length - 1];
    const buildPatterns = [
      /build.*(?:app|application|website|project)/i,
      /create.*(?:app|application|website|project)/i,
      /develop.*(?:app|application|website|project)/i,
      /make.*(?:app|application|website|project)/i,
      /generate.*(?:app|application|website|project)/i
    ];

    if (buildPatterns.some(pattern => pattern.test(lastMessage.content))) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const aiTeamResponse = await fetch(
          `${req.url.replace('/api/chat', '/api/ai-team/coordinate')}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              userRequest: lastMessage.content,
              chatId: finalChatId,
            }),
          }
        );

        clearTimeout(timeoutId);

        if (aiTeamResponse.ok) {
          const buildResult = await aiTeamResponse.json();
          
          // Save AI team response to Convex
          if (finalChatId) {
            try {
              await convex.mutation(api.chats.addMessage, {
                chatId: finalChatId,
                content: `🤖 **AI Development Team Completed Your Project!**\n\n**Project Type**: ${buildResult?.analysis?.projectType ?? 'N/A'}\n**Complexity**: ${buildResult?.analysis?.complexity ?? 'N/A'}\n**Tech Stack**: ${Array.isArray(buildResult?.analysis?.techStack) ? buildResult.analysis.techStack.join(', ') : 'N/A'}\n**Features**: ${Array.isArray(buildResult?.analysis?.features) ? buildResult.analysis.features.join(', ') : 'N/A'}\n\n**Team Progress:**\n${Array.isArray(buildResult?.teamLog) ? buildResult.teamLog.join('\n') : 'N/A'}\n\n✅ **Your project is ready!** You can see it running in the WebContainer below.`,
                role: 'assistant'
              });
            } catch (error) {
              console.error('Failed to save AI team response:', error);
            }
          }

          return new Response(
            JSON.stringify({
              response: `🤖 **AI Development Team Completed Your Project!**\n\n**Project Type**: ${buildResult.analysis?.projectType ?? 'N/A'}\n**Complexity**: ${buildResult.analysis?.complexity ?? 'N/A'}\n**Tech Stack**: ${buildResult.analysis?.techStack?.join(', ') ?? 'N/A'}\n**Features**: ${buildResult.analysis?.features?.join(', ') ?? 'N/A'}\n\n**Team Progress:**\n${buildResult.teamLog?.join('\n') ?? 'N/A'}\n\n✅ **Your project is ready!** You can see it running in the WebContainer below.`,
              chatId: finalChatId,
              tokenUsage: getTokenUsageStats(),
              aiTeamTriggered: true,
              projectFiles: buildResult.projectFiles,
              teamBuild: buildResult
            }),
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      } catch (error) {
        console.error('AI team build failed:', error);
        // Fall back to normal chat
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