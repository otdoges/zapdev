import { streamOpenRouterResponse } from '@/lib/openrouter';
import { auth } from '@clerk/nextjs/server';


// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, modelId } = await req.json();
    
    if (!modelId || typeof modelId !== 'string') {
      return new Response('Invalid or missing modelId', { status: 400 });
    }
    const { userId } = await auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const result = await streamOpenRouterResponse({
      chatHistory: messages,
      modelId,
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Error in chat API:', error);
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response('An unknown error occurred', { status: 500 });
  }
} 