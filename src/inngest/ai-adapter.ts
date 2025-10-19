import { openai as inngestOpenAI } from "@inngest/agent-kit";
import { generateAIResponse, ModelName } from "@/lib/ai-gateway";
import { CoreMessage } from "ai";

export interface OptimizedModelConfig {
  model: string;
  apiKey: string;
  baseUrl: string;
  defaultParameters?: {
    temperature?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

export function createOptimizedModel(config: OptimizedModelConfig) {
  const inngestModel = inngestOpenAI(config);
  
  const enhancedModel = Object.create(inngestModel);
  
  enhancedModel._generateWithVercelSDK = async (messages: CoreMessage[], options?: {
    temperature?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    max_tokens?: number;
  }) => {
    const modelMapping: Record<string, ModelName> = {
      'google/gemini-2.5-flash-lite': 'geminiFlashLite',
      'moonshotai/kimi-k2-0905': 'kimiK2',
      'openai/gpt-4o-mini': 'gpt4oMini',
    };
    
    const vercelModelName = modelMapping[config.model];
    
    if (vercelModelName) {
      try {
        const result = await generateAIResponse({
          messages,
          model: vercelModelName,
          temperature: options?.temperature ?? config.defaultParameters?.temperature,
        });
        
        return {
          text: result.text,
          usage: result.usage,
          finishReason: result.finishReason,
        };
      } catch (error) {
        console.warn('Vercel SDK generation failed, falling back to standard API:', error);
      }
    }
    
    return null;
  };
  
  return enhancedModel;
}

export const optimizedModels = {
  geminiFlashLite: createOptimizedModel({
    model: "google/gemini-2.5-flash-lite",
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
    defaultParameters: {
      temperature: 0.3,
    },
  }),
  
  kimiK2: createOptimizedModel({
    model: "moonshotai/kimi-k2-0905",
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
    defaultParameters: {
      temperature: 0.7,
      frequency_penalty: 0.5,
    },
  }),
};

export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`[PERF] ${name} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[PERF] ${name} failed after ${duration}ms`, error);
    throw error;
  }
}