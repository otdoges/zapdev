import { OpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, generateText, CoreMessage, Message } from 'ai';
import { systemPrompt } from './systemprompt';
import { ChatHistory } from './types';

// Model IDs available for selection
export const modelIds = [
  "deepseek/deepseek-chat:free",
  "microsoft/phi-4-reasoning-plus:free",
  "qwen/qwen3-32b:free",
  "deepseek/deepseek-r1-0528:free",
  "deepseek/deepseek-v3-base:free"
];

export function getModelId(modelIdFromParam?: string) {
  return modelIdFromParam || "openrouter/auto";
}

// Function to get the API key from environment variables
const getOpenRouterApiKey = () => {
  const apiKey = process.env.NEXT_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_OPENROUTER_API_KEY environment variable is not set. Please add it to your .env file.");
  }
  return apiKey;
};

// Initialize the OpenRouter provider lazily
let openrouterProviderInstance: OpenRouter | null = null;

const getOpenRouterInstance = () => {
  if (!openrouterProviderInstance) {
    openrouterProviderInstance = new OpenRouter({
      apiKey: getOpenRouterApiKey(),
    });
  }
  return openrouterProviderInstance;
}

export const openrouterProvider = getOpenRouterInstance();

function prepareMessages(chatHistory: ChatHistory, systemPromptText: string): CoreMessage[] {
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


export async function streamOpenRouterResponse({
    chatHistory,
    modelId,
   temperature = 0.7,
   maxTokens = 4096,
}: {
    chatHistory: ChatHistory;
    modelId?: string;
   temperature?: number;
   maxTokens?: number;
}) {
    if (!modelId && modelIds.length === 0) {
        throw new Error("No model ID provided and no default models available");
    }
    const selectedModelId = getModelId(modelId);
    const model = getOpenRouterInstance().chat(selectedModelId);
    
    const messages = prepareMessages(chatHistory, systemPrompt);

    return await streamText({
        model,
        messages,
       temperature,
       maxTokens,
    });
}

export async function generateOpenRouterResponse(
  chatHistory: ChatHistory,
  modelIdFromParam?: string 
): Promise<string> {
  try {
    const selectedModelId = getModelId(modelIdFromParam);
    const model = getOpenRouterInstance().chat(selectedModelId);

    const messages = prepareMessages(chatHistory, systemPrompt);

    const { text } = await generateText({
      model: model,
      messages: messages,
    });
    
    return text;
  } catch (error) {
    console.error("Error generating response from OpenRouter:", error);
    let errorMessage = "Sorry, I encountered an error while processing your request with OpenRouter.";
    if (error instanceof Error) {
      if (error.message.includes("NEXT_OPENROUTER_API_KEY")) {
        errorMessage = "The OpenRouter API key is not configured correctly. Please check your environment variables.";
      } else {
        errorMessage = `OpenRouter Error: ${error.message}`;
      }
    }
    return errorMessage;
  }
}
