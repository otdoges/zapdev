// Groq Provider - Modular Implementation
// This replaces the monolithic lib/groq.ts file

// Model configurations and utilities
export {
  type GroqModelConfig,
  groqModelConfigs,
  groqModelIds,
  type ReasoningFormat,
  getAvailableGroqModels,
  getGroqModelId,
  getModelConfig,
  // Legacy exports for compatibility
  groqModelConfigs as modelConfigs,
  groqModelIds as modelIds
} from './models';

// Token usage tracking
export {
  type GroqTokenUsage,
  trackGroqTokenUsage,
  getRemainingTokens,
  getGroqTokenUsageStats
} from './token-tracking';

// Provider and client setup
export {
  getGroqInstance,
  groqProvider,
  defaultGroq,
  prepareGroqMessages,
  prepareDefaultGroqMessages
} from './provider';

// Response generation functions
export {
  getMultiGroqResponses,
  streamGroqResponse,
  generateGroqResponse
} from './responses';

// Enhanced token usage stats with model information
export function getEnhancedGroqTokenUsageStats() {
  const { getGroqTokenUsageStats } = require('./token-tracking');
  const { getAvailableGroqModels } = require('./models');
  
  const tokenStats = getGroqTokenUsageStats();
  const availableModels = getAvailableGroqModels(tokenStats.remaining);
  
  return {
    ...tokenStats,
    availableModels: availableModels.length,
    reasoningModelsAvailable: availableModels.filter((m: any) => m.isReasoning).length,
    models: availableModels.map((m: any) => ({
      id: m.id,
      name: m.name,
      isReasoning: m.isReasoning,
      capabilities: m.capabilities
    }))
  };
}

// Note: Whisper transcription functionality has been removed as requested
// If you need audio transcription, consider using a dedicated transcription service 