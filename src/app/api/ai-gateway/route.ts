import { NextRequest } from 'next/server';
import { streamAIResponse, generateAIResponse, createMessages, ModelName } from '@/lib/ai-gateway';
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string(),
  model: z.enum(['geminiFlashLite', 'kimiK2', 'gpt4oMini']).optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, systemPrompt, temperature, stream } = requestSchema.parse(body);
    
    const messages = createMessages(prompt, systemPrompt);
    
    if (stream) {
      const result = await streamAIResponse({
        messages,
        model: model as ModelName,
        temperature,
        system: systemPrompt,
      });
      
      return new Response(result.textStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const result = await generateAIResponse({
        messages,
        model: model as ModelName,
        temperature,
        system: systemPrompt,
      });
      
      return Response.json({
        text: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
      });
    }
  } catch (error) {
    console.error('AI Gateway error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    message: 'Vercel AI Gateway API',
    models: ['geminiFlashLite', 'kimiK2', 'gpt4oMini'],
    endpoints: {
      POST: {
        description: 'Generate AI responses with optional streaming',
        body: {
          prompt: 'string (required)',
          model: 'string (optional)',
          systemPrompt: 'string (optional)',
          temperature: 'number (optional, 0-2)',
          stream: 'boolean (optional, default: true)',
        },
      },
    },
  });
}