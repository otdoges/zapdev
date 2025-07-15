import { createGroq } from '@ai-sdk/groq'

const groqApiKey = import.meta.env.VITE_GROQ_API_KEY

if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
  console.error('Missing or invalid Groq API key')
  throw new Error('Missing Groq API key. Please set VITE_GROQ_API_KEY in your .env.local file.')
}

export const groq = createGroq({
  apiKey: groqApiKey,
})

// Available Groq models with context windows
export const GROQ_MODELS = {
  // Production Models
  'gemma2-9b-it': {
    name: 'Gemma 2 9B IT',
    provider: 'Google',
    contextWindow: 8192,
    type: 'production'
  },
  'llama-3.1-8b-instant': {
    name: 'Llama 3.1 8B Instant',
    provider: 'Meta',
    contextWindow: 131072,
    type: 'production'
  },
  'llama-3.3-70b-versatile': {
    name: 'Llama 3.3 70B Versatile',
    provider: 'Meta',
    contextWindow: 131072,
    maxCompletionTokens: 32768,
    type: 'production'
  },
  
  // Preview Models (Including Reasoning Models)
  'kimi-k2-instruct': {
    name: 'Kimi K2 Instruct',
    provider: 'Moonshot AI',
    contextWindow: 131072,
    maxCompletionTokens: 16384,
    type: 'preview',
    reasoning: true
  },
  'mistral-saba-24b': {
    name: 'Mistral Saba 24B',
    provider: 'Mistral',
    contextWindow: 32768,
    type: 'preview'
  },
  'qwen3-32b': {
    name: 'Qwen 3 32B',
    provider: 'Alibaba Cloud',
    contextWindow: 131072,
    maxCompletionTokens: 40960,
    type: 'preview'
  }
} as const

export type GroqModelId = keyof typeof GROQ_MODELS

// Helper function to get model info
export const getModelInfo = (modelId: GroqModelId) => {
  return GROQ_MODELS[modelId]
}

// Helper function to get all reasoning models
export const getReasoningModels = () => {
  return Object.entries(GROQ_MODELS)
    .filter(([_, model]) => model.reasoning)
    .map(([id, model]) => ({ id: id as GroqModelId, ...model }))
}

// Helper function to get all models
export const getAllModels = () => {
  return Object.entries(GROQ_MODELS)
    .map(([id, model]) => ({ id: id as GroqModelId, ...model }))
}

// Default model for chat
export const DEFAULT_MODEL: GroqModelId = 'llama-3.3-70b-versatile'