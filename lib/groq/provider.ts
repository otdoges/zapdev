import { groq, createGroq } from '@ai-sdk/groq';
import { CoreMessage } from 'ai';
import { systemPrompt } from '../systemprompt';
import { ChatHistory } from '../types';

// Function to get the Groq API key from environment variables
const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set. Please add it to your .env file.");
  }
  return apiKey;
};

// Initialize the Groq provider lazily
let groqProviderInstance: ReturnType<typeof createGroq> | null = null;

export const getGroqInstance = () => {
  if (!groqProviderInstance) {
    groqProviderInstance = createGroq({
      apiKey: getGroqApiKey(),
      baseURL: 'https://api.groq.com/openai/v1', // Groq API endpoint
    });
  }
  return groqProviderInstance;
};

// Main Groq provider interface
export const groqProvider = {
  chat: (modelId: string) => getGroqInstance()(modelId),
};

// Default Groq instance for direct usage
export const defaultGroq = groq;

// Prepare messages for Groq API
export function prepareGroqMessages(
  chatHistory: ChatHistory, 
  systemPromptText: string
): CoreMessage[] {
  const messages: CoreMessage[] = [{ role: "system", content: systemPromptText }];

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