import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText, CoreMessage } from 'ai';

const VERCEL_AI_GATEWAY_URL = process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1';
const VERCEL_AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || '';

export const openai = createOpenAI({
  apiKey: VERCEL_AI_GATEWAY_API_KEY,
  baseURL: VERCEL_AI_GATEWAY_URL,
});

export const models = {
  geminiFlashLite: openai('google/gemini-2.5-flash-lite'),
  kimiK2: openai('moonshotai/kimi-k2-0905'),
  gpt4oMini: openai('openai/gpt-4o-mini'),
} as const;

export type ModelName = keyof typeof models;

interface StreamingOptions {
  messages: CoreMessage[];
  model?: ModelName;
  temperature?: number;
  system?: string;
  onFinish?: (text: string) => void | Promise<void>;
}

export async function streamAIResponse({
  messages,
  model = 'kimiK2',
  temperature = 0.7,
  system,
  onFinish,
}: StreamingOptions) {
  const streamOptions: Parameters<typeof streamText>[0] = {
    model: models[model],
    messages,
    system,
    temperature,
  };
  
  if (onFinish) {
    streamOptions.onFinish = async ({ text }) => {
      await onFinish(text);
    };
  }
  
  return streamText(streamOptions);
}

type GenerateOptions = Omit<StreamingOptions, 'onFinish'>

export async function generateAIResponse(options: GenerateOptions) {
  const { messages, model = 'kimiK2', temperature, system } = options;
  
  return generateText({
    model: models[model],
    messages,
    system,
    temperature,
  });
}

export function createMessages(
  userPrompt: string,
  systemPrompt?: string,
  previousMessages: CoreMessage[] = []
): CoreMessage[] {
  const messages: CoreMessage[] = [...previousMessages];
  
  if (systemPrompt && messages.length === 0) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: userPrompt });
  
  return messages;
}

export function extractTextFromMessage(message: CoreMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    return message.content
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');
  }
  
  return '';
}