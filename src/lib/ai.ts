import { createGroq } from '@ai-sdk/groq'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, streamText } from 'ai'
import * as Sentry from '@sentry/react'
import { recordAIConversation } from './usage-service'
import { SYSTEM_PROMPT } from './systemprompt'

import { 
  withRetry, 
  monitorAIOperation, 
  AICircuitBreaker, 
  AIResponseCache,
  parseAIError,
  enforceClientAIRate,
  withTimeout
} from './ai-utils'
import { aiMonitoring } from './ai-monitoring'
import { getSecureApiKey, getApiKeySource } from './secure-storage'
import { toast } from 'sonner'

const { logger } = Sentry;

// Initialize production utilities
const circuitBreaker = new AICircuitBreaker();
const responseCache = new AIResponseCache();

// Cost tracking and limits
const MODEL_PRICING = {
  'moonshotai/kimi-k2-instruct': {
    // Pricing based on Groq docs: $1.00 / 1M input tokens, $3.00 / 333,333 output tokens
    input: 1.00 / 1_000_000,
    output: 3.00 / 333_333,
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

// Get user's API key securely with validation
async function getUserApiKey(): Promise<string | null> {
  try {
    const userKey = await getSecureApiKey();
    if (userKey && userKey.startsWith('gsk_') && userKey.length > 20) {
      return userKey;
    }
    return null;
  } catch (error) {
    logger.warn('Error retrieving user API key:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

// Create Groq instance with enhanced validation and error handling
async function createGroqInstance() {
  const userApiKey = await getUserApiKey();
  const envApiKey = import.meta.env.VITE_GROQ_API_KEY;
  const apiKey = userApiKey || envApiKey || '';
  
  // Validate API key before creating instance
  if (!apiKey || apiKey.length < 20 || apiKey === 'your_groq_api_key_here' || apiKey.includes('xxxxx')) {
    const error = new Error(
      '🔑 No Groq API key configured!\n\n' +
      '📋 Quick setup (2 minutes):\n' +
      '1. Visit https://console.groq.com/keys\n' +
      '2. Sign up (free)\n' +
      '3. Create API key\n' +
      '4. Add to .env.local: VITE_GROQ_API_KEY=your_key\n' +
      '5. Restart server\n\n' +
      '💡 Check QUICK_SETUP.md for detailed instructions!'
    );
    logger.error('Groq API key validation failed', { hasUserKey: !!userApiKey, hasEnvKey: !!envApiKey });
    toast.error('🔑 Groq API key required! Check console for setup instructions.', { duration: 8000 });
    throw error;
  }
  
  // Validate key format
  if (!apiKey.startsWith('gsk_')) {
    const error = new Error(
      '❌ Invalid Groq API key format!\n\n' +
      'Groq API keys should start with "gsk_"\n' +
      'Example: gsk_abc123...\n\n' +
      '🔧 Please check your API key at https://console.groq.com/keys'
    );
    logger.error('Groq API key format validation failed');
    toast.error('❌ Invalid Groq API key format. Keys should start with "gsk_"', { duration: 6000 });
    throw error;
  }
  
  // Security: No API key logging to prevent accidental exposure
  
  return createGroq({ 
    apiKey, 
    baseURL: 'https://api.groq.com/openai/v1',
    // Add timeout and retry configuration
    fetch: (input, init) => {
      return fetch(input, {
        ...init,
        signal: AbortSignal.timeout(60000), // 60 second timeout
      });
    }
  });
}

// OpenRouter as failsafe provider
const openrouter = createOpenRouter({
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
})

// Get current model instance
async function getCurrentModel() {
  const groq = createGroqInstance();
  return (await groq)('moonshotai/kimi-k2-instruct');
}

// Gemma model (for concise title generation)
async function getGemmaModel() {
  const groq = await createGroqInstance();
  return groq('moonshotai/kimi-k2-instruct');
}

// OpenRouter failsafe model
const fallbackModel = openrouter.chat('qwen/qwen3-coder:free')

export async function generateAIResponse(prompt: string, options?: { skipCache?: boolean }) {
  // Rate limit client-side bursts
  enforceClientAIRate();

  // Check cache first
  if (!options?.skipCache) {
    const cacheKey = responseCache.generateKey(prompt, { type: 'generate' });
    const cached = responseCache.get(cacheKey);
    if (cached) {
      logger.info('Using cached AI response');
      aiMonitoring.recordOperation({
        operation: 'generateText',
        model: 'moonshotai/kimi-k2-instruct',
        duration: 0,
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

        const estimatedInputTokens = Math.ceil(prompt.length / 4);
        const estimatedOutputTokens = 8000;
        const estimatedCost = calculateCost('moonshotai/kimi-k2-instruct', estimatedInputTokens, estimatedOutputTokens);
        
        checkCostLimit(estimatedCost);

        logger.info("Starting AI text generation", { 
          promptLength: prompt.length,
          estimatedCost: estimatedCost.toFixed(6),
          apiKeySource
        });

        const currentModel = await getCurrentModel();
        span.setAttribute("model", "moonshotai/kimi-k2-instruct");
        
        const { text, usage } = await circuitBreaker.execute(
          () => withRetry(
            () => monitorAIOperation(
              () => withTimeout(generateText({
                model: currentModel,
                prompt,
                temperature: 0.6,
              }), 60_000),
              'generateText',
              { model: 'moonshotai/kimi-k2-instruct', promptLength: prompt.length }
            ),
            'AI Text Generation'
          ),
          'generateAIResponse'
        )
        
        const actualCost = usage ? calculateCost('moonshotai/kimi-k2-instruct', usage.inputTokens || 0, usage.outputTokens || 0) : estimatedCost;
        addTodayCost(actualCost);

        await recordAIConversation({
          model: 'moonshotai/kimi-k2-instruct',
          inputTokens: usage?.inputTokens || 0,
          outputTokens: usage?.outputTokens || 0,
          cost: actualCost,
        });

        span.setAttribute("response_length", text.length);
        span.setAttribute("actual_cost", actualCost.toFixed(6));
        span.setAttribute("input_tokens", usage?.inputTokens || 0);
        span.setAttribute("output_tokens", usage?.outputTokens || 0);
        
        logger.info("AI text generation completed", { 
          responseLength: text.length,
          model: "moonshotai/kimi-k2-instruct",
          actualCost: actualCost.toFixed(6),
          inputTokens: usage?.inputTokens || 0,
          outputTokens: usage?.outputTokens || 0,
          dailyCost: getTodayCost().toFixed(4)
        });
        
        aiMonitoring.recordOperation({
          operation: 'generateText',
          model: 'moonshotai/kimi-k2-instruct',
          duration: Date.now() - startTime,
          success: true,
          inputTokens: usage?.inputTokens || 0,
          outputTokens: usage?.outputTokens || 0,
          cost: actualCost,
          cacheHit: false
        });
        
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
        
        aiMonitoring.recordOperation({
          operation: 'generateText',
          model: 'moonshotai/kimi-k2-instruct',
          duration: Date.now() - startTime,
          success: false,
          error: aiError.message,
          errorCode: aiError.code,
          cacheHit: false
        });
        
        try {
          if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
            logger.warn("OpenRouter API key not configured, cannot use failsafe");
            throw error
          }
          
          logger.info("Trying OpenRouter failsafe");
          span.setAttribute("failsafe_used", true);
          span.setAttribute("failsafe_model", "qwen/qwen3-coder:free");
          
          const { text } = await withTimeout(generateText({
            model: fallbackModel,
            prompt,
            temperature: 0.7,
          }), 30_000)
          
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

export async function streamAIResponse(prompt: string) {
  // Rate limit client-side bursts
  enforceClientAIRate();

  return Sentry.startSpan(
    {
      op: "ai.stream",
      name: "Stream AI Response",
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

        const systemPrompt = SYSTEM_PROMPT;
        const fullPrompt = systemPrompt + "\n\n" + prompt;
        const estimatedInputTokens = Math.ceil(fullPrompt.length / 4);
        const estimatedOutputTokens = 8000;
        const estimatedCost = calculateCost('moonshotai/kimi-k2-instruct', estimatedInputTokens, estimatedOutputTokens);
        
        checkCostLimit(estimatedCost);

        logger.info("Starting AI text streaming", { 
          promptLength: prompt.length,
          estimatedCost: estimatedCost.toFixed(6),
          apiKeySource
        });

        const model = await getCurrentModel();
        span.setAttribute("model", "moonshotai/kimi-k2-instruct");

        const result = await circuitBreaker.execute(
          () => withRetry(
            () => monitorAIOperation(
              async () => streamText({
                model: await model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: prompt }
                ],
                temperature: 0.6,
              }),
              'streamText',
              { model: 'moonshotai/kimi-k2-instruct', promptLength: prompt.length }
            ),
            'AI Stream Generation'
          ),
          'streamAIResponse'
        )
        
        addTodayCost(estimatedCost);

        await recordAIConversation({
          model: 'moonshotai/kimi-k2-instruct',
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
          cost: estimatedCost,
        });
        
        logger.info("AI streaming started successfully", { 
          model: "moonshotai/kimi-k2-instruct",
          estimatedCost: estimatedCost.toFixed(6),
          dailyCost: getTodayCost().toFixed(4)
        });
        
        aiMonitoring.recordOperation({
          operation: 'streamText',
          model: 'moonshotai/kimi-k2-instruct',
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
  isNearLimit: () => getTodayCost() > (DAILY_COST_LIMIT * 0.8),
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
    });
    const title = (res.text || 'New chat').trim().replace(/^"|"$/g, '').replace(/[.!?\s]+$/g, '').slice(0, 60);
    return title.length > 0 ? title : 'New chat';
  } catch {
    return 'New chat';
  }
}