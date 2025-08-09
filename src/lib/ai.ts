import { createGroq } from '@ai-sdk/groq'
import { createOpenRouter, LanguageModelV1 } from '@openrouter/ai-sdk-provider'
import { generateText, streamText } from 'ai'
import * as Sentry from '@sentry/react'
import { recordAIConversation } from './usage-service'
import { SYSTEM_PROMPT } from './systemprompt'
import { DECISION_PROMPT_NEXT } from './decisionPrompt'
import { getSecureApiKey, getApiKeySource } from './secure-storage'
import { 
  withRetry, 
  monitorAIOperation, 
  AICircuitBreaker, 
  AIResponseCache,
  parseAIError,
  AIRateLimitError,
  AIQuotaExceededError
} from './ai-utils'
import { aiMonitoring } from './ai-monitoring'

const { logger } = Sentry;

// Initialize production utilities
const circuitBreaker = new AICircuitBreaker();
const responseCache = new AIResponseCache();

// Cost tracking and limits
const MODEL_PRICING = {
  'openai/gpt-oss-120b': {
    // Pricing based on Groq docs: $0.15 / 1M input tokens, $0.75 / 1M output tokens
    input: 0.15 / 1_000_000,
    output: 0.75 / 1_000_000,
  }
};

const DAILY_COST_LIMIT = 1.00; // $1.00 daily limit
const COST_STORAGE_KEY = 'zapdev-daily-cost';

// Cost tracking functions
function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[modelId as keyof typeof MODEL_PRICING];
  if (!pricing) return 0;
  
  return (inputTokens * pricing.input) + (outputTokens * pricing.output);
}

function getTodayCost(): number {
  try {
    const stored = localStorage.getItem(COST_STORAGE_KEY);
    if (!stored) return 0;
    
    const { date, cost } = JSON.parse(stored);
    const today = new Date().toDateString();
    
    if (date === today) {
      return cost;
    }
    
    return 0; // Reset for new day
  } catch {
    return 0;
  }
}

function addTodayCost(cost: number): void {
  try {
    const today = new Date().toDateString();
    const currentCost = getTodayCost();
    const newCost = currentCost + cost;
    
    localStorage.setItem(COST_STORAGE_KEY, JSON.stringify({
      date: today,
      cost: newCost
    }));
  } catch (error) {
    console.error('Error saving cost data:', error);
  }
}

function checkCostLimit(estimatedCost: number): void {
  const currentCost = getTodayCost();
  if (currentCost + estimatedCost > DAILY_COST_LIMIT) {
    throw new Error(`Daily cost limit of $${DAILY_COST_LIMIT} would be exceeded. Current: $${currentCost.toFixed(4)}, Request: $${estimatedCost.toFixed(4)}`);
  }
}

// Get user's API key securely
async function getUserApiKey(): Promise<string | null> {
  return await getSecureApiKey();
}

// Create Groq instance with user key or fallback to env key
async function createGroqInstance() {
  const userApiKey = await getUserApiKey();
  const apiKey = userApiKey || import.meta.env.VITE_GROQ_API_KEY || '';
  
  // Security: Never log API key information in production
  if (import.meta.env.MODE === 'development') {
    if (userApiKey) {
      console.log('🔑 Using user-provided Groq API key');
    } else if (import.meta.env.VITE_GROQ_API_KEY) {
      console.log('🔑 Using environment Groq API key');
    }
  }
  
  return createGroq({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
}

// OpenRouter as failsafe provider
const openrouter = createOpenRouter({
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
})

// Get current model instance
async function getCurrentModel() {
  const groq = createGroqInstance();
  return (await groq)('openai/gpt-oss-120b');
}

// Gemma model (for concise title generation)
async function getGemmaModel() {
  const groq = await createGroqInstance();
  return groq('openai/gpt-oss-120b');
}

// OpenRouter failsafe model
const fallbackModel = openrouter.chat('qwen/qwen3-coder:free')

export async function generateAIResponse(prompt: string, options?: { skipCache?: boolean }) {
  // Check cache first
  if (!options?.skipCache) {
    const cacheKey = responseCache.generateKey(prompt, { type: 'generate' });
    const cached = responseCache.get(cacheKey);
    if (cached) {
      logger.info('Using cached AI response');
      
      // Record cache hit
      aiMonitoring.recordOperation({
        operation: 'generateText',
        model: 'openai/gpt-oss-120b',
        duration: 0, // Instant from cache
        success: true,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        cacheHit: true
      });
      
      return cached as string;
    }
  }
  
  return Sentry.startSpan(
    {
      op: "ai.generate",
      name: "Generate AI Response",
    },
    async (span) => {
      const startTime = Date.now();
      try {
        const userApiKey = await getUserApiKey();
        const envApiKey = import.meta.env.VITE_GROQ_API_KEY;
        const apiKeySource = getApiKeySource();
        
        span.setAttribute("prompt_length", prompt.length);
        span.setAttribute("api_key_source", apiKeySource);
        
        if (!userApiKey && !envApiKey) {
          const error = new Error('No Groq API key configured. Please add your API key in Settings or set VITE_GROQ_API_KEY in environment variables.');
          Sentry.captureException(error);
          throw error;
        }

        // Estimate cost for input tokens (rough estimate: 1 token ≈ 4 chars)
        const estimatedInputTokens = Math.ceil(prompt.length / 4);
        const estimatedOutputTokens = 8000; // Max tokens we might use
        const estimatedCost = calculateCost('openai/gpt-oss-120b', estimatedInputTokens, estimatedOutputTokens);
        
        // Check cost limit before making request
        checkCostLimit(estimatedCost);

        logger.info("Starting AI text generation", { 
          promptLength: prompt.length,
          estimatedCost: estimatedCost.toFixed(6),
          apiKeySource
        });

        // Get current model before callback chain
        const currentModel = await getCurrentModel();
        span.setAttribute("model", "openai/gpt-oss-120b");
        
        // Execute with circuit breaker and retry logic
        const { text, usage } = await circuitBreaker.execute(
          () => withRetry(
            () => monitorAIOperation(
              () => generateText({
                model: currentModel,
                prompt,
                maxTokens: 8000, // using openai/gpt-oss-120b
                temperature: 0.7,
              }),
              'generateText',
              { model: 'openai/gpt-oss-120b', promptLength: prompt.length }
            ),
            'AI Text Generation'
          ),
          'generateAIResponse'
        )
        
        // Calculate actual cost based on usage
        const actualCost = usage ? calculateCost('openai/gpt-oss-120b', usage.promptTokens, usage.completionTokens) : estimatedCost;
        addTodayCost(actualCost);

        // Record usage event
        await recordAIConversation({
          model: 'openai/gpt-oss-120b',
          inputTokens: usage?.promptTokens || 0,
          outputTokens: usage?.completionTokens || 0,
          cost: actualCost,
        });

        span.setAttribute("response_length", text.length);
        span.setAttribute("actual_cost", actualCost.toFixed(6));
        span.setAttribute("input_tokens", usage?.promptTokens || 0);
        span.setAttribute("output_tokens", usage?.completionTokens || 0);
        
        logger.info("AI text generation completed", { 
          responseLength: text.length,
          model: "openai/gpt-oss-120b",
          actualCost: actualCost.toFixed(6),
          inputTokens: usage?.promptTokens || 0,
          outputTokens: usage?.completionTokens || 0,
          dailyCost: getTodayCost().toFixed(4)
        });
        
        // Record monitoring metrics
        aiMonitoring.recordOperation({
          operation: 'generateText',
          model: 'openai/gpt-oss-120b',
          duration: Date.now() - startTime,
          success: true,
          inputTokens: usage?.promptTokens || 0,
          outputTokens: usage?.completionTokens || 0,
          cost: actualCost,
          cacheHit: false
        });
        
        // Cache the response
        if (!options?.skipCache) {
          const cacheKey = responseCache.generateKey(prompt, { type: 'generate' });
          responseCache.set(cacheKey, text);
        }
        
        return text
      } catch (error) {
        const aiError = parseAIError(error);
        logger.error("AI generation error", { 
          error: aiError.message,
          code: aiError.code,
          isRetryable: aiError.isRetryable 
        });
        Sentry.captureException(aiError);
        
        // Record failed operation
        aiMonitoring.recordOperation({
          operation: 'generateText',
          model: 'openai/gpt-oss-120b',
          duration: Date.now() - startTime,
          success: false,
          error: aiError.message,
          errorCode: aiError.code,
          cacheHit: false
        });
        
        // Handle specific error types
        if (aiError instanceof AIRateLimitError) {
          // Could implement backoff based on retryAfter
          logger.warn('Rate limit hit, using fallback provider');
        } else if (aiError instanceof AIQuotaExceededError) {
          // Alert user about quota
          logger.error('Quota exceeded, fallback to free tier');
        }
        
        // Try OpenRouter as failsafe
        try {
          if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
            logger.warn("OpenRouter API key not configured, cannot use failsafe");
            throw error
          }
          
          logger.info("Trying OpenRouter failsafe");
          span.setAttribute("failsafe_used", true);
          span.setAttribute("failsafe_model", "qwen/qwen3-coder:free");
          
          const { text } = await generateText({
            model: fallbackModel,
            prompt,
            maxTokens: 4000,
            temperature: 0.7,
          })
          
          logger.info("OpenRouter failsafe succeeded", { responseLength: text.length });
          span.setAttribute("response_length", text.length);
          return text
        } catch (fallbackError) {
          logger.error("OpenRouter failsafe also failed", { 
            originalError: error instanceof Error ? error.message : String(error),
            fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          });
          Sentry.captureException(fallbackError);
          throw error
        }
      }
    }
  );
}

export async function streamAIResponse(prompt: string, options?: { skipCache?: boolean }) {
  // Note: Streaming responses are not cached
  
  return Sentry.startSpan(
    {
      op: "ai.stream",
      name: "Stream AI Response",
    },
    async (span) => {
      const startTime = Date.now();
      try {
        const userApiKey = getUserApiKey();
        const envApiKey = import.meta.env.VITE_GROQ_API_KEY;
        const apiKeySource = getApiKeySource();
        
        span.setAttribute("prompt_length", prompt.length);
        span.setAttribute("api_key_source", apiKeySource);
        
        if (!userApiKey && !envApiKey) {
          const error = new Error('No Groq API key configured. Please add your API key in Settings or set VITE_GROQ_API_KEY in environment variables.');
          Sentry.captureException(error);
          throw error;
        }

        // Use full development-focused system prompt
        const systemPrompt = SYSTEM_PROMPT;

        const fullPrompt = systemPrompt + "\n\n" + prompt;
        const estimatedInputTokens = Math.ceil(fullPrompt.length / 4);
        const estimatedOutputTokens = 8000; // Max tokens we might use
        const estimatedCost = calculateCost('openai/gpt-oss-120b', estimatedInputTokens, estimatedOutputTokens);
        
        // Check cost limit before making request
        checkCostLimit(estimatedCost);

        logger.info("Starting AI text streaming", { 
          promptLength: prompt.length,
          estimatedCost: estimatedCost.toFixed(6),
          apiKeySource
        });

        const model = await getCurrentModel();
        span.setAttribute("model", "openai/gpt-oss-120b");

        const result = await circuitBreaker.execute(
          () => withRetry(
            () => monitorAIOperation(
              async () => streamText({
                model: await model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: prompt }
                ],
                maxTokens: 8000, // using openai/gpt-oss-120b
                temperature: 0.7,
              }),
              'streamText',
              { model: 'openai/gpt-oss-120b', promptLength: prompt.length }
            ),
            'AI Stream Generation'
          ),
          'streamAIResponse'
        )
        
        // Add cost tracking for streaming (estimate since we don't get exact tokens upfront)
        addTodayCost(estimatedCost);

        // Record usage event (estimated for streaming)
        await recordAIConversation({
          model: 'openai/gpt-oss-120b',
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
          cost: estimatedCost,
        });
        
        logger.info("AI streaming started successfully", { 
          model: "openai/gpt-oss-120b",
          estimatedCost: estimatedCost.toFixed(6),
          dailyCost: getTodayCost().toFixed(4)
        });
        
        // Record streaming operation (with estimates)
        aiMonitoring.recordOperation({
          operation: 'streamText',
          model: 'openai/gpt-oss-120b',
          duration: Date.now() - startTime,
          success: true,
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
          cost: estimatedCost,
          cacheHit: false
        });
        
        return result
      } catch (error) {
        const aiError = parseAIError(error);
        logger.error("AI streaming error", { 
          error: aiError.message,
          code: aiError.code,
          isRetryable: aiError.isRetryable 
        });
        Sentry.captureException(aiError);
        
        // Try OpenRouter as failsafe
        try {
          if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
            logger.warn("OpenRouter API key not configured, cannot use failsafe");
            throw error
          }
          
          logger.info("Trying OpenRouter streaming failsafe");
          span.setAttribute("failsafe_used", true);
          span.setAttribute("failsafe_model", "qwen/qwen3-coder:free");
          
          const systemPrompt = SYSTEM_PROMPT;
          
          const result = await streamText({
            model: fallbackModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            maxTokens: 4000, // Keep lower limit for fallback model
            temperature: 0.7,
          })
          
          logger.info("OpenRouter streaming failsafe succeeded");
          return result
        } catch (fallbackError) {
          logger.error("OpenRouter streaming failsafe also failed", { 
            originalError: error instanceof Error ? error.message : String(error),
            fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          });
          Sentry.captureException(fallbackError);
          throw error
        }
      }
    }
  );
}

// Export cost tracking functions for use in other components
export const costTracker = {
  getTodayCost,
  getDailyLimit: () => DAILY_COST_LIMIT,
  getRemainingBudget: () => DAILY_COST_LIMIT - getTodayCost(),
  getCostPercentage: () => (getTodayCost() / DAILY_COST_LIMIT) * 100,
  isNearLimit: () => getTodayCost() > (DAILY_COST_LIMIT * 0.8), // 80% threshold
};

export async function generateChatTitleFromMessages(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
  try {
    const model = await getGemmaModel();
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const seed = lastUser?.content || messages[messages.length - 1]?.content || '';
    const instruction = `Create a short, catchy chat title (max 8 words). No quotes. No trailing punctuation. Focus on the main task/topic.\n\nContext:\n${seed.slice(0, 600)}`;
    const res = await generateText({
      model,
      prompt: instruction,
      temperature: 0.3,
      maxTokens: 24,
    });
    const title = (res.text || 'New chat').trim().replace(/^"|"$/g, '').replace(/[.!?\s]+$/g, '').slice(0, 60);
    return title.length > 0 ? title : 'New chat';
  } catch (e) {
    return 'New chat';
  }
}