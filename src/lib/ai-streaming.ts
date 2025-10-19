import { streamText, generateText, type CoreMessage } from 'ai';
import { fastModel, smartModel } from './ai-gateway';

interface StreamOptions {
  model?: 'fast' | 'smart';
  temperature?: number;
  system?: string;
  onChunk?: (text: string) => void;
}

export async function streamAIResponse(
  messages: CoreMessage[],
  options: StreamOptions = {}
) {
  const {
    model = 'fast',
    temperature,
    system,
    onChunk,
  } = options;

  const selectedModel = model === 'smart' ? smartModel : fastModel;

  const result = streamText({
    model: selectedModel,
    messages,
    system,
    temperature: temperature ?? (model === 'fast' ? 0.3 : 0.7),
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'ai-streaming',
    },
    onChunk: onChunk ? ({ chunk }) => {
      if (chunk.type === 'text-delta') {
        onChunk(chunk.text);
      }
    } : undefined,
  });

  return result;
}

export async function generateAIResponse(
  messages: CoreMessage[],
  options: StreamOptions = {}
) {
  const {
    model = 'fast',
    temperature,
    system,
  } = options;

  const selectedModel = model === 'smart' ? smartModel : fastModel;

  const result = await generateText({
    model: selectedModel,
    messages,
    system,
    temperature: temperature ?? (model === 'fast' ? 0.3 : 0.7),
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'ai-generation',
    },
  });

  return result;
}

export const createStreamResponse = async (
  prompt: string,
  options: StreamOptions = {}
) => {
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: prompt,
    },
  ];

  return streamAIResponse(messages, options);
};

export const createGenerateResponse = async (
  prompt: string,
  options: StreamOptions = {}
) => {
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: prompt,
    },
  ];

  return generateAIResponse(messages, options);
};
