import { streamText, generateText } from 'ai';
import { ChatHistory } from '../types';
import {
  groqModelConfigs,
  getGroqModelId,
  getAvailableGroqModels,
  getModelConfig,
  ReasoningFormat,
} from './models';
import { trackGroqTokenUsage, getRemainingTokens } from './token-tracking';
import { getGroqInstance, prepareDefaultGroqMessages } from './provider';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

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
  const remainingTokens = getRemainingTokens();
  const availableModels = getAvailableGroqModels(remainingTokens);
  const messages = prepareDefaultGroqMessages(chatHistory);

  // Select primary and secondary models (prioritize reasoning models)
  const primary =
    availableModels.find((m) => m.id === primaryModelId) ||
    availableModels.find((m) => m.isReasoning) ||
    availableModels[0];
  const secondary =
    availableModels.find((m) => m.id !== primary?.id && m.isReasoning) ||
    availableModels.find((m) => m.id !== primary?.id);

  if (!primary) {
    throw new Error('No Groq models available within token limits');
  }

  // Prepare provider options for reasoning models
  const getProviderOptions = (model: typeof primary) => {
    if (model?.isReasoning && useReasoning) {
      return {
        groq: { reasoningFormat },
      };
    }
    return undefined;
  };

  const responses = await Promise.allSettled([
    // Primary model response
    generateText({
      model: getGroqInstance()(primary.id),
      messages,
      temperature,
      maxTokens: Math.min(maxTokens, primary.maxTokens),
      providerOptions: getProviderOptions(primary),
    }),
    // Secondary model response (if available)
    ...(secondary
      ? [
          generateText({
            model: getGroqInstance()(secondary.id),
            messages,
            temperature: temperature + 0.1, // Slight variation for diversity
            maxTokens: Math.min(maxTokens, secondary.maxTokens),
            providerOptions: getProviderOptions(secondary),
          }),
        ]
      : []),
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
      reasoning:
        result.status === 'fulfilled' && model?.isReasoning
          ? result.value.experimental_providerMetadata?.groq?.reasoning
          : null,
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
  const remainingTokens = getRemainingTokens();
  const availableModels = getAvailableGroqModels(remainingTokens);

  if (availableModels.length === 0) {
    throw new Error('Daily Groq token limit reached. Please try again tomorrow.');
  }

  const selectedModelId = getGroqModelId(modelId, availableModels);
  const modelConfig = getModelConfig(selectedModelId);
  const finalMaxTokens = Math.min(maxTokens, modelConfig?.maxTokens || 2048);

  const model = getGroqInstance()(selectedModelId);
  const messages = prepareDefaultGroqMessages(chatHistory);

  // Use reasoning capabilities for supported models
  const providerOptions =
    modelConfig?.isReasoning && useReasoning
      ? {
          groq: { reasoningFormat },
        }
      : undefined;

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
      useReasoning = true,
    } = options;

    const remainingTokens = getRemainingTokens();
    const availableModels = getAvailableGroqModels(remainingTokens);

    if (availableModels.length === 0) {
      return {
        text: 'Daily Groq token limit reached. Please try again tomorrow or check your Groq API key.',
        modelUsed: 'none',
        isReasoning: false,
      };
    }

    const selectedModelId = getGroqModelId(modelIdFromParam, availableModels);
    const modelConfig = getModelConfig(selectedModelId);
    const model = getGroqInstance()(selectedModelId);

    const messages = prepareDefaultGroqMessages(chatHistory);

    // Configure reasoning for supported models
    const providerOptions =
      modelConfig?.isReasoning && useReasoning
        ? {
            groq: { reasoningFormat },
          }
        : undefined;

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
      reasoning: modelConfig?.isReasoning
        ? result.experimental_providerMetadata?.groq?.reasoning
        : undefined,
      modelUsed: selectedModelId,
      isReasoning: modelConfig?.isReasoning || false,
    };
  } catch (error) {
    errorLogger.error(ErrorCategory.AI_MODEL, 'Error generating response from Groq:', error);
    let errorMessage = 'Sorry, I encountered an error while processing your request with Groq.';
    if (error instanceof Error) {
      if (error.message.includes('GROQ_API_KEY')) {
        errorMessage =
          'The Groq API key is not configured correctly. Please check your environment variables.';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'Groq token limit reached. Please try again later.';
      } else {
        errorMessage = `Groq Error: ${error.message}`;
      }
    }
    return {
      text: errorMessage,
      modelUsed: 'error',
      isReasoning: false,
    };
  }
}
