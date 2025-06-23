import { groq, createGroq } from '@ai-sdk/groq';
import { streamText, generateText, CoreMessage } from 'ai';
import { systemPrompt } from './systemprompt';
import { ChatHistory } from './types';

// Enhanced model configuration with Groq reasoning models
export const groqModelConfigs = [
  {
    id: "deepseek-r1-distill-qwen-32b",
    name: "DeepSeek R1 Distill Qwen 32B",
    description: "Advanced reasoning model with distilled architecture for complex problem solving",
    maxTokens: 8192,
    priority: 1,
    isReasoning: true,
    capabilities: ["reasoning", "code_generation", "analysis", "problem_solving"]
  },
  {
    id: "qwen-qwq-32b",
    name: "Qwen QwQ 32B",
    description: "Large-scale reasoning model with enhanced query understanding",
    maxTokens: 8192,
    priority: 2,
    isReasoning: true,
    capabilities: ["reasoning", "analysis", "creative_thinking", "logic"]
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    description: "Versatile large language model for general tasks",
    maxTokens: 4096,
    priority: 3,
    isReasoning: false,
    capabilities: ["general", "conversation", "writing", "analysis"]
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma2 9B IT",
    description: "Efficient model optimized for IT and development tasks",
    maxTokens: 2048,
    priority: 4,
    isReasoning: false,
    capabilities: ["code", "development", "technical"]
  }
];

// Reasoning format options for Groq models
export type ReasoningFormat = 'parsed' | 'hidden' | 'raw';

// Function to get the Groq API key from environment variables
const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set. Please add it to your .env file.");
  }
  return apiKey;
};

// Initialize the Groq provider
let groqProviderInstance: ReturnType<typeof createGroq> | null = null;

const getGroqInstance = () => {
  if (!groqProviderInstance) {
    groqProviderInstance = createGroq({
      apiKey: getGroqApiKey(),
    });
  }
  return groqProviderInstance;
}

// Main Groq provider interface
export const groqProvider = {
  chat: (modelId: string) => getGroqInstance().chat(modelId),
};

// Get best available model
export function getGroqModelId(modelIdFromParam?: string) {
  if (modelIdFromParam && groqModelConfigs.find(m => m.id === modelIdFromParam)) {
    return modelIdFromParam;
  }
  
  // Return highest priority reasoning model
  const reasoningModel = groqModelConfigs.find(m => m.isReasoning);
  return reasoningModel?.id || "llama-3.3-70b-versatile";
}

function prepareGroqMessages(chatHistory: ChatHistory, systemPromptText: string): CoreMessage[] {
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

// Enhanced streaming function with reasoning support
export async function streamGroqResponse({
  chatHistory,
  modelId,
  temperature = 0.7,
  maxTokens = 4096,
  reasoningFormat = 'parsed',
  useReasoning = true,
}: {
  chatHistory: ChatHistory;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  reasoningFormat?: ReasoningFormat;
  useReasoning?: boolean;
}) {
  const selectedModelId = getGroqModelId(modelId);
  const modelConfig = groqModelConfigs.find(m => m.id === selectedModelId);
  const finalMaxTokens = Math.min(maxTokens, modelConfig?.maxTokens || 4096);
  
  const model = getGroqInstance().chat(selectedModelId);
  const messages = prepareGroqMessages(chatHistory, systemPrompt);

  // Use reasoning capabilities for supported models
  const providerOptions = modelConfig?.isReasoning && useReasoning ? {
    groq: { reasoningFormat }
  } : undefined;

  const result = await streamText({
    model,
    messages,
    temperature,
    maxTokens: finalMaxTokens,
    providerOptions,
  });

  return result;
}

// Generate response with reasoning
export async function generateGroqResponse(
  chatHistory: ChatHistory,
  modelIdFromParam?: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    reasoningFormat?: ReasoningFormat;
    useReasoning?: boolean;
  } = {}
): Promise<{
  text: string;
  reasoning?: any;
  modelUsed: string;
  isReasoning: boolean;
}> {
  try {
    const {
      temperature = 0.7,
      maxTokens = 4096,
      reasoningFormat = 'parsed',
      useReasoning = true
    } = options;
    
    const selectedModelId = getGroqModelId(modelIdFromParam);
    const modelConfig = groqModelConfigs.find(m => m.id === selectedModelId);
    const model = getGroqInstance().chat(selectedModelId);

    const messages = prepareGroqMessages(chatHistory, systemPrompt);

    // Configure reasoning for supported models
    const providerOptions = modelConfig?.isReasoning && useReasoning ? {
      groq: { reasoningFormat }
    } : undefined;

    const result = await generateText({
      model: model,
      messages: messages,
      maxTokens: modelConfig?.maxTokens || maxTokens,
      temperature,
      providerOptions,
    });
    
    return {
      text: result.text,
      reasoning: modelConfig?.isReasoning ? 
        result.experimental_providerMetadata?.groq?.reasoning : undefined,
      modelUsed: selectedModelId,
      isReasoning: modelConfig?.isReasoning || false
    };
  } catch (error) {
    console.error("Error generating response from Groq:", error);
    let errorMessage = "Sorry, I encountered an error while processing your request with Groq.";
    if (error instanceof Error) {
      if (error.message.includes("GROQ_API_KEY")) {
        errorMessage = "The Groq API key is not configured correctly. Please check your environment variables.";
      } else {
        errorMessage = `Groq Error: ${error.message}`;
      }
    }
    return {
      text: errorMessage,
      modelUsed: "error",
      isReasoning: false
    };
  }
}

export { groqModelConfigs as modelConfigs }; 