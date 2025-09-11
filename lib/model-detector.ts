// Model Detection Utility
// Automatically detects which AI models are available based on API keys

export interface ModelAvailability {
  model: string;
  available: boolean;
  priority: number;
}

export function detectAvailableModels(): ModelAvailability[] {
  // Check individual API keys first (higher priority than AI Gateway)
  const models: ModelAvailability[] = [
    {
      model: 'anthropic/claude-sonnet-4-20250514',
      available: !!process.env.ANTHROPIC_API_KEY || !!process.env.AI_GATEWAY_API_KEY,
      priority: process.env.ANTHROPIC_API_KEY ? 1 : 5 // Prefer direct API key
    },
    {
      model: 'openai/gpt-5',
      available: !!process.env.OPENAI_API_KEY || !!process.env.AI_GATEWAY_API_KEY,
      priority: process.env.OPENAI_API_KEY ? 2 : 6
    },
    {
      model: 'google/gemini-2.0-flash-exp',
      available: !!process.env.GEMINI_API_KEY || !!process.env.AI_GATEWAY_API_KEY,
      priority: process.env.GEMINI_API_KEY ? 3 : 7
    },
    {
      model: 'groq/llama-3.3-70b-versatile',
      available: !!process.env.GROQ_API_KEY || !!process.env.AI_GATEWAY_API_KEY,
      priority: process.env.GROQ_API_KEY ? 4 : 8
    }
  ];

  return models.filter(m => m.available).sort((a, b) => a.priority - b.priority);
}

export function getBestAvailableModel(): string {
  const availableModels = detectAvailableModels(); // Already filtered and sorted
  
  if (availableModels.length === 0) {
    console.warn('No API keys detected, cannot determine model');
    throw new Error('No API keys configured. Please set up at least one AI provider API key.');
  }
  
  console.log(`Auto-detected model: ${availableModels[0].model}`);
  return availableModels[0].model;
}

export function getAvailableModels(): string[] {
  return detectAvailableModels().map(m => m.model); // Already filtered
}

export function isModelAvailable(model: string): boolean {
  const availableModels = getAvailableModels();
  return availableModels.includes(model);
}

// Client-side version (cannot access process.env)
export function detectAvailableModelsClient(): ModelAvailability[] {
  // On client side, we'll need to call an API to get this information
  // For now, return empty array and handle via server-side API
  return [];
}

export function getBestAvailableModelClient(): Promise<string> {
  // This will make an API call to get the best available model
  return fetch('/api/detect-model')
    .then(res => res.json())
    .then(data => data.model)
    .catch(() => 'groq/llama-3.3-70b-versatile'); // fallback
}