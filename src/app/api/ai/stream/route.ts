import { streamText } from 'ai';
import { fastModel, smartModel } from '@/lib/ai-gateway';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'edge';
export const maxDuration = 60;

interface StreamRequest {
  prompt: string;
  system?: string;
  modelType?: 'fast' | 'smart';
  temperature?: number;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body: StreamRequest = await req.json();
    const { prompt, system, modelType = 'fast', temperature } = body;

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const selectedModel = modelType === 'smart' ? smartModel : fastModel;

    const result = streamText({
      model: selectedModel,
      prompt,
      system,
      temperature: temperature ?? (modelType === 'fast' ? 0.3 : 0.7),
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'stream-ai-response',
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[AI Stream Error]:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to stream AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
