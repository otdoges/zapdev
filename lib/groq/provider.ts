import { groq, createGroq } from '@ai-sdk/groq';
import { CoreMessage } from 'ai';
import { systemPrompt } from '../systemprompt';
import { ChatHistory } from '../types';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

// Function to get the Groq API key from environment variables
const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY environment variable is not set. Please add it to your .env file.'
    );
  }
  return apiKey;
};

// Initialize the Groq provider lazily
let groqProviderInstance: ReturnType<typeof createGroq> | null = null;

// Create the Groq provider instance with validation
export const getGroqInstance = (): ReturnType<typeof createGroq> => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    errorLogger.warning(
      ErrorCategory.AI_MODEL,
      'GROQ_API_KEY is not configured. AI features will be limited.'
    );
    // Return a function that creates mock model instances
    const stub = (modelId: string) => ({
      // This will be caught by the error handling in responses.ts
      generateText: async () => {
        throw new Error(
          'Groq API key is not configured. Please add GROQ_API_KEY to your environment variables.'
        );
      },
      streamText: async () => {
        throw new Error(
          'Groq API key is not configured. Please add GROQ_API_KEY to your environment variables.'
        );
      },
    });

    return stub as unknown as ReturnType<typeof createGroq>;
  }

  return createGroq({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
};

// Export a pre-configured provider with backward-compatible interface
export const groqProvider = {
  chat: (modelId: string) => {
    const instance = getGroqInstance();
    return instance(modelId);
  },
};

// Default Groq instance for direct usage
export const defaultGroq = groq;

// Prepare messages for Groq API
export function prepareGroqMessages(
  chatHistory: ChatHistory,
  systemPromptText: string
): CoreMessage[] {
  const messages: CoreMessage[] = [{ role: 'system', content: systemPromptText }];

  chatHistory.forEach((msg) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  });

  return messages;
}

// Default system prompt preparation
export function prepareDefaultGroqMessages(chatHistory: ChatHistory): CoreMessage[] {
  return prepareGroqMessages(chatHistory, systemPrompt);
}
