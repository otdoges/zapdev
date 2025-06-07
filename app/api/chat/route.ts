import { CoreMessage, streamText, generateText } from 'ai';
import { sequentialThinking } from '@/lib/sequential-thinker';
import { auth } from '@clerk/nextjs/server';

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

// Check for OpenRouter API key
if (!process.env.NEXT_OPENROUTER_API_KEY) {
  console.warn('NEXT_OPENROUTER_API_KEY is not set. API calls may fail.');
}

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    const { userId } = await auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Use the new sequential thinking process
    const response = await sequentialThinking(messages);

    // For now, let's return the final response as a non-streamed text response.
    // Streaming would require more significant changes to sequential-thinker.
    return new Response(response, {
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response('An unknown error occurred', { status: 500 });
  }
} 