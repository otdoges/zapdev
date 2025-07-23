import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

// Standard AI SDK message format
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
}

import type { NextApiRequest, NextApiResponse } from 'next';

// Allow streaming responses up to 30 seconds (following official docs)
export const maxDuration = 30;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body as ChatRequest;
    
    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Get API key from server environment (not exposed to client)
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return res.status(500).json({ error: 'API_KEY_MISSING' });
    }

    // Create Groq client with secure server-side API key  
    const groqClient = createGroq({
      apiKey: apiKey
    });

    // Use AI SDK's streamText with Groq provider (following official patterns)
    const result = await streamText({
      model: groqClient('llama-3.3-70b-versatile'),
      messages: messages,
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Return the AI SDK's data stream response (optimized for Vercel)
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Groq proxy error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Enable CORS for preflight requests
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}; 