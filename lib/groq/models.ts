// Groq model configurations and selection utilities

export interface GroqModelConfig {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  priority: number;
  isReasoning: boolean;
  capabilities: string[];
}

// Enhanced model configuration with Groq reasoning models
export const groqModelConfigs: GroqModelConfig[] = [
  {
    id: 'deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 Distill Qwen 32B',
    description: 'Advanced reasoning model with distilled architecture for complex problem solving',
    maxTokens: 8192,
    priority: 1,
    isReasoning: true,
    capabilities: ['reasoning', 'code_generation', 'analysis', 'problem_solving'],
  },
  {
    id: 'qwen-qwq-32b',
    name: 'Qwen QwQ 32B',
    description: 'Large-scale reasoning model with enhanced query understanding',
    maxTokens: 8192,
    priority: 2,
    isReasoning: true,
    capabilities: ['reasoning', 'analysis', 'creative_thinking', 'logic'],
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    description: 'Versatile large language model for general tasks',
    maxTokens: 4096,
    priority: 3,
    isReasoning: false,
    capabilities: ['general', 'conversation', 'writing', 'analysis'],
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma2 9B IT',
    description: 'Efficient model optimized for IT and development tasks',
    maxTokens: 2048,
    priority: 4,
    isReasoning: false,
    capabilities: ['code', 'development', 'technical'],
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: 'Fast response model for quick interactions',
    maxTokens: 2048,
    priority: 5,
    isReasoning: false,
    capabilities: ['instant', 'quick_responses', 'general'],
  },
];

// Reasoning format options for Groq models
export type ReasoningFormat = 'parsed' | 'hidden' | 'raw';

// Legacy support for existing code
export const groqModelIds = groqModelConfigs.map((config) => config.id);

// Get available Groq models within token limits
export function getAvailableGroqModels(maxTokensRemaining?: number): GroqModelConfig[] {
  if (typeof window === 'undefined') return groqModelConfigs; // Server-side, return all

  if (maxTokensRemaining === undefined) return groqModelConfigs;

  return groqModelConfigs.filter((config) => config.maxTokens <= maxTokensRemaining);
}

export function getGroqModelId(
  modelIdFromParam?: string,
  availableModels: GroqModelConfig[] = groqModelConfigs
): string {
  if (modelIdFromParam && availableModels.find((m) => m.id === modelIdFromParam)) {
    return modelIdFromParam;
  }

  // Return highest priority available model (reasoning models first)
  const primaryModel = availableModels.sort((a, b) => {
    // Prioritize reasoning models
    if (a.isReasoning && !b.isReasoning) return -1;
    if (!a.isReasoning && b.isReasoning) return 1;
    return a.priority - b.priority;
  })[0];

  return primaryModel?.id || 'llama-3.3-70b-versatile';
}

export function getModelConfig(modelId: string): GroqModelConfig | undefined {
  return groqModelConfigs.find((m) => m.id === modelId);
}
