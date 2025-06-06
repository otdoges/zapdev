import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. Using a mock API for development.');
}

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, chatId } = await req.json();
  
  try {
    // Create text stream using the AI SDK
    const textStream = streamText({
      model: openai('gpt-4o'),
      messages: messages.map((message: any) => ({
        role: message.role === 'model' ? 'assistant' : message.role,
        content: message.content,
      })),
      temperature: 0.7,
      maxTokens: 1500,
    });

    // Convert the text stream to a response with the appropriate headers
    return new Response(textStream.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    // If we hit an error, return a 500 error with the error message
    console.error('Error in chat API route:', error);
    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request. Please make sure you have set up your OpenAI API key correctly.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 