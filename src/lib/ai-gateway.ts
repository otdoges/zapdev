import { createOpenAI } from '@ai-sdk/openai';

const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY!;
const AI_GATEWAY_BASE_URL = process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1';

const FAST_MODEL = 'google/gemini-2.5-flash-lite';
const SMART_MODEL = 'moonshotai/kimi-k2-0905';

const aiGatewayProvider = createOpenAI({
  apiKey: AI_GATEWAY_API_KEY,
  baseURL: AI_GATEWAY_BASE_URL,
});

export const fastModel = aiGatewayProvider(FAST_MODEL);
export const smartModel = aiGatewayProvider(SMART_MODEL);

export const aiGatewayConfig = {
  fastModel: {
    name: FAST_MODEL,
    defaultParameters: {
      temperature: 0.3,
      frequencyPenalty: 0.3,
    },
  },
  smartModel: {
    name: SMART_MODEL,
    defaultParameters: {
      temperature: 0.7,
      frequencyPenalty: 0.5,
    },
  },
  errorFixModel: {
    name: SMART_MODEL,
    defaultParameters: {
      temperature: 0.5,
      frequencyPenalty: 0.5,
    },
  },
  titleGeneratorModel: {
    name: FAST_MODEL,
    defaultParameters: {
      temperature: 0.3,
    },
  },
  frameworkSelectorModel: {
    name: FAST_MODEL,
    defaultParameters: {
      temperature: 0.3,
    },
  },
} as const;

export const getOptimizedModelConfig = (modelType: keyof typeof aiGatewayConfig) => {
  const config = aiGatewayConfig[modelType];
  return {
    model: config.name,
    apiKey: AI_GATEWAY_API_KEY,
    baseUrl: AI_GATEWAY_BASE_URL,
    defaultParameters: config.defaultParameters,
  };
};

export const streamingConfig = {
  headers: {
    'X-Experimental-Stream-Data': 'true',
  },
  experimental_streamData: true,
} as const;

export const retryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffFactor: 2,
} as const;

export const timeoutConfig = {
  connectionTimeoutMs: 10000,
  requestTimeoutMs: 60000,
} as const;

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    const isRetryable = 
      error instanceof Error && 
      (error.message.includes('timeout') || 
       error.message.includes('503') ||
       error.message.includes('429') ||
       error.message.includes('ECONNREFUSED'));

    if (!isRetryable) {
      throw error;
    }

    console.log(`[AI Gateway] Retrying after ${delayMs}ms... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    return withRetry(
      fn, 
      retries - 1, 
      Math.min(delayMs * retryConfig.backoffFactor, retryConfig.maxDelayMs)
    );
  }
}

export function createTimeoutPromise<T>(
  promise: Promise<T>,
  timeoutMs: number = timeoutConfig.requestTimeoutMs
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}
