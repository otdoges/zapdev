import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_utils/auth';
import { logSanitizedError } from '../src/utils/error-sanitizer';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth({ headers: new Headers(req.headers as Record<string, string>) });
    if (!authResult.success || !authResult.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { messages, apiKey, model = 'gemini-2.0-flash-exp' }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Validate API key format (basic validation)
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      return res.status(400).json({ error: 'Invalid Gemini API key format' });
    }

    // Configure the Google provider with the user's API key
    const gemini = google({ apiKey });

    // Check if this is a streaming request
    const isStreaming = req.headers['accept']?.includes('text/stream') || 
                       req.headers['x-stream'] === 'true';

    if (isStreaming) {
      // Stream the response
      const result = await streamText({
        model: gemini(model),
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        maxCompletionTokens: 4000,
      });

      return result.toTextStreamResponse();
    } else {
      // Generate a complete response
      const { text, usage } = await generateText({
        model: gemini(model),
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        maxCompletionTokens: 4000,
      });

      return res.status(200).json({
        message: {
          role: 'assistant',
          content: text,
        },
        usage: {
          promptTokens: usage?.inputTokens || 0,
          completionTokens: usage?.outputTokens || 0,
          totalTokens: usage?.totalTokens || 0,
        },
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logSanitizedError('Secret chat API error', error);
    
    // Handle specific API errors
    if (errorMessage.includes('API key')) {
      return res.status(401).json({ 
        error: 'Invalid or expired API key. Please check your Gemini API key.' 
      });
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'API quota exceeded or rate limit reached. Please try again later.' 
      });
    }

    if (errorMessage.includes('model')) {
      return res.status(400).json({ 
        error: 'Invalid model specified. Please use a valid Gemini model.' 
      });
    }

    return res.status(500).json({ 
      error: 'An error occurred while processing your request. Please try again.' 
    });
  }
}