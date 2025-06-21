import { OpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, generateText, CoreMessage, Message } from 'ai';
import { systemPrompt } from './systemprompt';
import { ChatHistory } from './types';

// Enhanced model configuration with token limits
export const modelConfigs = [
  {
    id: "deepseek/deepseek-r1-0528:free",
    name: "DeepSeek R1",
    description: "Advanced reasoning model for complex tasks",
    maxTokens: 4096,
    priority: 1
  },
  {
    id: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    name: "DeepSeek R1 Qwen3",
    description: "Efficient reasoning with Qwen3 architecture",
    maxTokens: 3072,
    priority: 2
  },
  {
    id: "microsoft/phi-4-reasoning-plus:free", 
    name: "Phi-4 Reasoning Plus",
    description: "Advanced reasoning capabilities from Microsoft",
    maxTokens: 2048,
    priority: 3
  },
  {
    id: "qwen/qwen3-32b:free",
    name: "Qwen 3 32B",
    description: "Large context understanding",
    maxTokens: 2048,
    priority: 4
  },
  {
    id: "agentica-org/deepcoder-14b-preview:free",
    name: "DeepCoder 14B",
    description: "Code generation and development tasks",
    maxTokens: 1536,
    priority: 5
  }
];

// Legacy support for existing code
export const modelIds = modelConfigs.map(config => config.id);

// Token usage tracking
interface TokenUsage {
  modelId: string;
  tokensUsed: number;
  timestamp: number;
}

let dailyTokenUsage: TokenUsage[] = [];
const MAX_DAILY_TOKENS = 50000; // Adjust based on your OpenRouter limits

// Reset daily usage if it's a new day
function resetDailyUsageIfNeeded() {
  const now = new Date();
  const today = now.toDateString();
  const lastReset = localStorage?.getItem('tokenUsageResetDate');
  
  if (lastReset !== today) {
    dailyTokenUsage = [];
    localStorage?.setItem('tokenUsageResetDate', today);
  }
}

// Get available models within token limits
function getAvailableModels(): typeof modelConfigs {
  if (typeof window === 'undefined') return modelConfigs; // Server-side, return all
  
  resetDailyUsageIfNeeded();
  
  const totalUsed = dailyTokenUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
  const remainingTokens = MAX_DAILY_TOKENS - totalUsed;
  
  return modelConfigs.filter(config => config.maxTokens <= remainingTokens);
}

// Track token usage
function trackTokenUsage(modelId: string, tokens: number) {
  if (typeof window === 'undefined') return; // Server-side, skip tracking
  
  dailyTokenUsage.push({
    modelId,
    tokensUsed: tokens,
    timestamp: Date.now()
  });
  
  // Store in localStorage for persistence
  localStorage.setItem('dailyTokenUsage', JSON.stringify(dailyTokenUsage));
}

export function getModelId(modelIdFromParam?: string) {
  const availableModels = getAvailableModels();
  
  if (modelIdFromParam && availableModels.find(m => m.id === modelIdFromParam)) {
    return modelIdFromParam;
  }
  
  // Return highest priority available model
  const primaryModel = availableModels.sort((a, b) => a.priority - b.priority)[0];
  return primaryModel?.id || "openrouter/auto";
}

// Function to get the API key from environment variables
const getOpenRouterApiKey = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set. Please add it to your .env file.");
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

export const openrouterProvider = {
  chat: (modelId: string) => getOpenRouterInstance().chat(modelId),
};

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

// Enhanced function to get multiple model responses
export async function getMultiModelResponses({
  chatHistory,
  primaryModelId,
  temperature = 0.7,
  maxTokens = 1024,
}: {
  chatHistory: ChatHistory;
  primaryModelId?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const availableModels = getAvailableModels();
  const messages = prepareMessages(chatHistory, systemPrompt);
  
  // Select primary and secondary models
  const primary = availableModels.find(m => m.id === primaryModelId) || availableModels[0];
  const secondary = availableModels.find(m => m.id !== primary?.id) || availableModels[1];
  
  if (!primary) {
    throw new Error("No models available within token limits");
  }
  
  const responses = await Promise.allSettled([
    // Primary model response
    generateText({
      model: getOpenRouterInstance().chat(primary.id),
      messages,
      temperature,
      maxTokens: Math.min(maxTokens, primary.maxTokens),
    }),
    // Secondary model response (if available)
    ...(secondary ? [generateText({
      model: getOpenRouterInstance().chat(secondary.id),
      messages,
      temperature: temperature + 0.1, // Slight variation for diversity
      maxTokens: Math.min(maxTokens, secondary.maxTokens),
    })] : [])
  ]);
  
  const results = responses.map((result, index) => ({
    modelId: index === 0 ? primary.id : secondary?.id,
    modelName: index === 0 ? primary.name : secondary?.name,
    success: result.status === 'fulfilled',
    response: result.status === 'fulfilled' ? result.value.text : null,
    error: result.status === 'rejected' ? result.reason : null,
  }));
  
  // Track token usage for successful responses
  results.forEach((result, index) => {
    if (result.success && result.response) {
      const model = index === 0 ? primary : secondary;
      if (model) {
        // Estimate token usage (rough estimate: 1 token ≈ 4 characters)
        const estimatedTokens = Math.ceil(result.response.length / 4);
        trackTokenUsage(model.id, estimatedTokens);
      }
    }
  });
  
  return results;
}

export async function streamOpenRouterResponse({
    chatHistory,
    modelId,
   temperature = 0.7,
   maxTokens = 1024, // Reduced default to conserve tokens
}: {
    chatHistory: ChatHistory;
    modelId?: string;
   temperature?: number;
   maxTokens?: number;
}) {
    const availableModels = getAvailableModels();
    if (availableModels.length === 0) {
        throw new Error("Daily token limit reached. Please try again tomorrow.");
    }
    
    const selectedModelId = getModelId(modelId);
    const modelConfig = modelConfigs.find(m => m.id === selectedModelId);
    const finalMaxTokens = Math.min(maxTokens, modelConfig?.maxTokens || 1024);
    
    const model = getOpenRouterInstance().chat(selectedModelId);
    const messages = prepareMessages(chatHistory, systemPrompt);

    const result = await streamText({
        model,
        messages,
       temperature,
       maxTokens: finalMaxTokens,
    });
    
    // Track token usage (estimate based on max tokens requested)
    if (modelConfig) {
      trackTokenUsage(selectedModelId, finalMaxTokens);
    }

    return result;
}

export async function generateOpenRouterResponse(
  chatHistory: ChatHistory,
  modelIdFromParam?: string 
): Promise<string> {
  try {
    const availableModels = getAvailableModels();
    if (availableModels.length === 0) {
      return "Daily token limit reached. Please try again tomorrow or upgrade your OpenRouter plan.";
    }
    
    const selectedModelId = getModelId(modelIdFromParam);
    const modelConfig = modelConfigs.find(m => m.id === selectedModelId);
    const model = getOpenRouterInstance().chat(selectedModelId);

    const messages = prepareMessages(chatHistory, systemPrompt);

    const { text } = await generateText({
      model: model,
      messages: messages,
      maxTokens: modelConfig?.maxTokens || 1024,
    });
    
    // Track token usage
    if (modelConfig) {
      const estimatedTokens = Math.ceil(text.length / 4);
      trackTokenUsage(selectedModelId, estimatedTokens);
    }
    
    return text;
  } catch (error) {
    console.error("Error generating response from OpenRouter:", error);
    let errorMessage = "Sorry, I encountered an error while processing your request with OpenRouter.";
    if (error instanceof Error) {
      if (error.message.includes("NEXT_OPENROUTER_API_KEY")) {
        errorMessage = "The OpenRouter API key is not configured correctly. Please check your environment variables.";
      } else if (error.message.includes("quota") || error.message.includes("limit")) {
        errorMessage = "Token limit reached. Please try again later or upgrade your OpenRouter plan.";
      } else {
        errorMessage = `OpenRouter Error: ${error.message}`;
      }
    }
    return errorMessage;
  }
}

// Get current token usage stats
export function getTokenUsageStats() {
  if (typeof window === 'undefined') return { used: 0, remaining: MAX_DAILY_TOKENS, percentage: 0 };
  
  resetDailyUsageIfNeeded();
  
  const totalUsed = dailyTokenUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
  const remaining = Math.max(0, MAX_DAILY_TOKENS - totalUsed);
  const percentage = (totalUsed / MAX_DAILY_TOKENS) * 100;
  
  return {
    used: totalUsed,
    remaining,
    percentage: Math.min(percentage, 100),
    availableModels: getAvailableModels().length
  };
}
