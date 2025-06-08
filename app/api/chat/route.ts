import { streamSequentialThinking } from '@/lib/sequential-thinker';
import { auth } from '@clerk/nextjs/server';
// @ts-ignore - This is a valid import but may be flagged by the linter
import { StreamData, StreamingTextResponse } from 'ai';

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

// Check for OpenRouter API key
if (!process.env.NEXT_OPENROUTER_API_KEY) {
  console.warn('NEXT_OPENROUTER_API_KEY is not set. API calls may fail.');
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const { userId } = await auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const data = new StreamData();

    const stream = await streamSequentialThinking({
      chatHistory: messages,
      data,
    });

    return new StreamingTextResponse(stream, {}, data);

  } catch (error) {
    console.error('Error in chat API:', error);
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response('An unknown error occurred', { status: 500 });
  }
} 