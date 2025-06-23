import { groq, createGroq } from '@ai-sdk/groq';
import { streamText, generateText, CoreMessage, Message } from 'ai';
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
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    description: "Fast response model for quick interactions",
    maxTokens: 2048,
    priority: 5,
    isReasoning: false,
    capabilities: ["instant", "quick_responses", "general"]
  }
];

// Reasoning format options for Groq models
export type ReasoningFormat = 'parsed' | 'hidden' | 'raw';

// Legacy support for existing code
export const groqModelIds = groqModelConfigs.map(config => config.id);

// Token usage tracking for Groq
interface GroqTokenUsage {
  modelId: string;
  tokensUsed: number;
  timestamp: number;
  requestType: 'stream' | 'generate';
  reasoningFormat?: ReasoningFormat;
}

let dailyGroqTokenUsage: GroqTokenUsage[] = [];
const MAX_DAILY_GROQ_TOKENS = 100000; // Groq has generous free tier limits

// Reset daily usage if it's a new day
function resetGroqDailyUsageIfNeeded() {
  if (typeof window === 'undefined') return; // Server-side check
  
  const now = new Date();
  const today = now.toDateString();
  const lastReset = localStorage?.getItem('groqTokenUsageResetDate');
  
  if (lastReset !== today) {
    dailyGroqTokenUsage = [];
    localStorage?.setItem('groqTokenUsageResetDate', today);
    localStorage?.setItem('dailyGroqTokenUsage', JSON.stringify([]));
  } else {
    // Load existing usage
    const stored = localStorage?.getItem('dailyGroqTokenUsage');
    if (stored) {
      try {
        dailyGroqTokenUsage = JSON.parse(stored);
      } catch (e) {
        dailyGroqTokenUsage = [];
      }
    }
  }
}

// Get available Groq models within token limits
function getAvailableGroqModels(): typeof groqModelConfigs {
  if (typeof window === 'undefined') return groqModelConfigs; // Server-side, return all
  
  resetGroqDailyUsageIfNeeded();
  
  const totalUsed = dailyGroqTokenUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
  const remainingTokens = MAX_DAILY_GROQ_TOKENS - totalUsed;
  
  return groqModelConfigs.filter(config => config.maxTokens <= remainingTokens);
}

// Track Groq token usage
function trackGroqTokenUsage(
  modelId: string, 
  tokens: number, 
  requestType: 'stream' | 'generate',
  reasoningFormat?: ReasoningFormat
) {
  if (typeof window === 'undefined') return; // Server-side, skip tracking
  
  dailyGroqTokenUsage.push({
    modelId,
    tokensUsed: tokens,
    timestamp: Date.now(),
    requestType,
    reasoningFormat
  });
  
  // Store in localStorage for persistence
  localStorage.setItem('dailyGroqTokenUsage', JSON.stringify(dailyGroqTokenUsage));
}

export function getGroqModelId(modelIdFromParam?: string) {
  const availableModels = getAvailableGroqModels();
  
  if (modelIdFromParam && availableModels.find(m => m.id === modelIdFromParam)) {
    return modelIdFromParam;
  }
  
  // Return highest priority available model (reasoning models first)
  const primaryModel = availableModels
    .sort((a, b) => {
      // Prioritize reasoning models
      if (a.isReasoning && !b.isReasoning) return -1;
      if (!a.isReasoning && b.isReasoning) return 1;
      return a.priority - b.priority;
    })[0];
    
  return primaryModel?.id || "llama-3.3-70b-versatile";
}

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

const getGroqInstance = () => {
  if (!groqProviderInstance) {
    groqProviderInstance = createGroq({
      apiKey: getGroqApiKey(),
      baseURL: 'https://api.groq.com/openai/v1', // Groq API endpoint
    });
  }
  return groqProviderInstance;
}

// Main Groq provider interface
export const groqProvider = {
  chat: (modelId: string) => getGroqInstance().chat(modelId),
  transcription: (modelId: string) => getGroqInstance().transcription(modelId), // Whisper models
};

// Default Groq instance for direct usage
export const defaultGroq = groq;

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

// Enhanced function to get multiple Groq model responses with reasoning
export async function getMultiGroqResponses({
  chatHistory,
  primaryModelId,
  temperature = 0.7,
  maxTokens = 2048,
  reasoningFormat = 'parsed',
  useReasoning = true,
}: {
  chatHistory: ChatHistory;
  primaryModelId?: string;
  temperature?: number;
  maxTokens?: number;
  reasoningFormat?: ReasoningFormat;
  useReasoning?: boolean;
}) {
  const availableModels = getAvailableGroqModels();
  const messages = prepareGroqMessages(chatHistory, systemPrompt);
  
  // Select primary and secondary models (prioritize reasoning models)
  const primary = availableModels.find(m => m.id === primaryModelId) || 
                 availableModels.find(m => m.isReasoning) || 
                 availableModels[0];
  const secondary = availableModels.find(m => m.id !== primary?.id && m.isReasoning) || 
                   availableModels.find(m => m.id !== primary?.id);
  
  if (!primary) {
    throw new Error("No Groq models available within token limits");
  }
  
  // Prepare provider options for reasoning models
  const getProviderOptions = (model: typeof primary) => {
    if (model?.isReasoning && useReasoning) {
      return {
        groq: { reasoningFormat }
      };
    }
    return undefined;
  };
  
  const responses = await Promise.allSettled([
    // Primary model response
    generateText({
      model: getGroqInstance().chat(primary.id),
      messages,
      temperature,
      maxTokens: Math.min(maxTokens, primary.maxTokens),
      providerOptions: getProviderOptions(primary),
    }),
    // Secondary model response (if available)
    ...(secondary ? [generateText({
      model: getGroqInstance().chat(secondary.id),
      messages,
      temperature: temperature + 0.1, // Slight variation for diversity
      maxTokens: Math.min(maxTokens, secondary.maxTokens),
      providerOptions: getProviderOptions(secondary),
    })] : [])
  ]);
  
  const results = responses.map((result, index) => {
    const model = index === 0 ? primary : secondary;
    return {
      modelId: model?.id,
      modelName: model?.name,
      isReasoning: model?.isReasoning || false,
      success: result.status === 'fulfilled',
      response: result.status === 'fulfilled' ? result.value.text : null,
      error: result.status === 'rejected' ? result.reason : null,
      reasoning: result.status === 'fulfilled' && model?.isReasoning ? 
        result.value.experimental_providerMetadata?.groq?.reasoning : null,
    };
  });
  
  // Track token usage for successful responses
  results.forEach((result, index) => {
    if (result.success && result.response) {
      const model = index === 0 ? primary : secondary;
      if (model) {
        const estimatedTokens = Math.ceil(result.response.length / 4);
        trackGroqTokenUsage(model.id, estimatedTokens, 'generate', reasoningFormat);
      }
    }
  });
  
  return results;
}

// Enhanced streaming function with reasoning support
export async function streamGroqResponse({
  chatHistory,
  modelId,
  temperature = 0.7,
  maxTokens = 2048,
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
  const availableModels = getAvailableGroqModels();
  if (availableModels.length === 0) {
    throw new Error("Daily Groq token limit reached. Please try again tomorrow.");
  }
  
  const selectedModelId = getGroqModelId(modelId);
  const modelConfig = groqModelConfigs.find(m => m.id === selectedModelId);
  const finalMaxTokens = Math.min(maxTokens, modelConfig?.maxTokens || 2048);
  
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
  
  // Track token usage (estimate based on max tokens requested)
  if (modelConfig) {
    trackGroqTokenUsage(selectedModelId, finalMaxTokens, 'stream', reasoningFormat);
  }

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
      maxTokens = 2048,
      reasoningFormat = 'parsed',
      useReasoning = true
    } = options;
    
    const availableModels = getAvailableGroqModels();
    if (availableModels.length === 0) {
      return {
        text: "Daily Groq token limit reached. Please try again tomorrow or check your Groq API key.",
        modelUsed: "none",
        isReasoning: false
      };
    }
    
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
    
    // Track token usage
    if (modelConfig) {
      const estimatedTokens = Math.ceil(result.text.length / 4);
      trackGroqTokenUsage(selectedModelId, estimatedTokens, 'generate', reasoningFormat);
    }
    
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
      } else if (error.message.includes("quota") || error.message.includes("limit")) {
        errorMessage = "Groq token limit reached. Please try again later.";
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

// Get comprehensive token usage statistics
export function getGroqTokenUsageStats() {
  if (typeof window === 'undefined') {
    return {
      used: 0,
      remaining: MAX_DAILY_GROQ_TOKENS,
      percentage: 0,
      availableModels: groqModelConfigs.length,
      reasoningModelsAvailable: groqModelConfigs.filter(m => m.isReasoning).length
    };
  }
  
  resetGroqDailyUsageIfNeeded();
  
  const totalUsed = dailyGroqTokenUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
  const remaining = Math.max(0, MAX_DAILY_GROQ_TOKENS - totalUsed);
  const percentage = Math.min(100, (totalUsed / MAX_DAILY_GROQ_TOKENS) * 100);
  const availableModels = getAvailableGroqModels();
  
  return {
    used: totalUsed,
    remaining,
    percentage,
    availableModels: availableModels.length,
    reasoningModelsAvailable: availableModels.filter(m => m.isReasoning).length,
    models: availableModels.map(m => ({
      id: m.id,
      name: m.name,
      isReasoning: m.isReasoning,
      capabilities: m.capabilities
    }))
  };
}

// Groq transcription capabilities (Whisper models)
export async function transcribeWithGroq(
  audioFile: File | Blob,
  options: {
    modelId?: string;
    language?: string;
    prompt?: string;
    temperature?: number;
    timestampGranularities?: ('word' | 'segment')[];
  } = {}
) {
  const {
    modelId = 'whisper-large-v3',
    language,
    prompt,
    temperature = 0,
    timestampGranularities = ['segment']
  } = options;

  try {
    const transcriptionModel = getGroqInstance().transcription(modelId);
    
    const result = await transcriptionModel({
      audio: audioFile,
      providerOptions: {
        groq: {
          language,
          prompt,
          temperature,
          timestampGranularities
        }
      }
    });

    return result;
  } catch (error) {
    console.error("Error transcribing with Groq:", error);
    throw error;
  }
}

export { groqModelConfigs as modelConfigs, groqModelIds as modelIds }; 