import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './_utils/auth';

export const runtime = 'edge';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  apiKey: string;
  model?: string;
}

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, apiKey, model = 'gemini-2.0-flash-exp' }: ChatRequest = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Validate API key format (basic validation)
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      return NextResponse.json({ error: 'Invalid Gemini API key format' }, { status: 400 });
    }

    // Configure the Google provider with the user's API key
    const gemini = google({
      apiKey: apiKey,
    });

    // Check if this is a streaming request
    const isStreaming = req.headers.get('accept')?.includes('text/stream') || 
                       req.headers.get('x-stream') === 'true';

    if (isStreaming) {
      // Stream the response
      const result = await streamText({
        model: gemini(model),
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        maxTokens: 4000,
      });

      return result.toDataStreamResponse();
    } else {
      // Generate a complete response
      const { text, usage } = await generateText({
        model: gemini(model),
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        maxTokens: 4000,
      });

      return NextResponse.json({
        message: {
          role: 'assistant',
          content: text,
        },
        usage: {
          promptTokens: usage?.promptTokens || 0,
          completionTokens: usage?.completionTokens || 0,
          totalTokens: usage?.totalTokens || 0,
        },
      });
    }
  } catch (error: any) {
    console.error('Secret chat API error:', error);
    
    // Handle specific API errors
    if (error?.message?.includes('API key')) {
      return NextResponse.json({ 
        error: 'Invalid or expired API key. Please check your Gemini API key.' 
      }, { status: 401 });
    }
    
    if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'API quota exceeded or rate limit reached. Please try again later.' 
      }, { status: 429 });
    }

    if (error?.message?.includes('model')) {
      return NextResponse.json({ 
        error: 'Invalid model specified. Please use a valid Gemini model.' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'An error occurred while processing your request. Please try again.' 
    }, { status: 500 });
  }
}