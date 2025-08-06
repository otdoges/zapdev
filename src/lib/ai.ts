import { createGroq } from '@ai-sdk/groq'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, streamText } from 'ai'
import * as Sentry from '@sentry/react'
import { recordAIConversation } from './usage-service'
import { getSecureApiKey, getApiKeySource } from './secure-storage'

const { logger } = Sentry;

// Cost tracking and limits
const MODEL_PRICING = {
  'openai/gpt-oss-20b': {
    input: 0.10 / 10_000_000, // $0.10 per 10M tokens
    output: 0.50 / 2_000_000,  // $0.50 per 2M tokens
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
function getUserApiKey(): string | null {
  return getSecureApiKey();
}

// Create Groq instance with user key or fallback to env key
function createGroqInstance() {
  const userApiKey = getUserApiKey();
  const apiKey = userApiKey || process.env.VITE_GROQ_API_KEY || '';
  
  // Security: Never log API key information in production
  if (process.env.NODE_ENV === 'development') {
    if (userApiKey) {
      console.log('🔑 Using user-provided Groq API key');
    } else if (process.env.VITE_GROQ_API_KEY) {
      console.log('🔑 Using environment Groq API key');
    }
  }
  
  return createGroq({ apiKey });
}

// OpenRouter as failsafe provider
const openrouter = createOpenRouter({
  apiKey: process.env.VITE_OPENROUTER_API_KEY || '',
})

// Get current model instance
function getCurrentModel() {
  const groq = createGroqInstance();
  return groq('openai/gpt-oss-20b');
}

// OpenRouter failsafe model
const fallbackModel = openrouter.chat('qwen/qwen3-coder:free')

export async function generateAIResponse(prompt: string) {
  return Sentry.startSpan(
    {
      op: "ai.generate",
      name: "Generate AI Response",
    },
    async (span) => {
      try {
        const userApiKey = getUserApiKey();
        const envApiKey = process.env.VITE_GROQ_API_KEY;
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
        const estimatedCost = calculateCost('openai/gpt-oss-20b', estimatedInputTokens, estimatedOutputTokens);
        
        // Check cost limit before making request
        checkCostLimit(estimatedCost);

        logger.info("Starting AI text generation", { 
          promptLength: prompt.length,
          estimatedCost: estimatedCost.toFixed(6),
          apiKeySource
        });

        const model = getCurrentModel();
        span.setAttribute("model", "openai/gpt-oss-20b");
        
        const { text, usage } = await generateText({
          model,
          prompt,
          maxTokens: 8000, // Increased token limit for openai/gpt-oss-20b (max 32,768)
          temperature: 0.7,
        })
        
        // Calculate actual cost based on usage
        const actualCost = usage ? calculateCost('openai/gpt-oss-20b', usage.promptTokens, usage.completionTokens) : estimatedCost;
        addTodayCost(actualCost);

        // Record usage event
        await recordAIConversation({
          model: 'openai/gpt-oss-20b',
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
          model: "openai/gpt-oss-20b",
          actualCost: actualCost.toFixed(6),
          inputTokens: usage?.promptTokens || 0,
          outputTokens: usage?.completionTokens || 0,
          dailyCost: getTodayCost().toFixed(4)
        });
        
        return text
      } catch (error) {
        logger.error("AI generation error", { error: error instanceof Error ? error.message : String(error) });
        Sentry.captureException(error);
        
        // Try OpenRouter as failsafe
        try {
          if (!process.env.VITE_OPENROUTER_API_KEY) {
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

export async function streamAIResponse(prompt: string) {
  return Sentry.startSpan(
    {
      op: "ai.stream",
      name: "Stream AI Response",
    },
    async (span) => {
      try {
        const userApiKey = getUserApiKey();
        const envApiKey = process.env.VITE_GROQ_API_KEY;
        const apiKeySource = getApiKeySource();
        
        span.setAttribute("prompt_length", prompt.length);
        span.setAttribute("api_key_source", apiKeySource);
        
        if (!userApiKey && !envApiKey) {
          const error = new Error('No Groq API key configured. Please add your API key in Settings or set VITE_GROQ_API_KEY in environment variables.');
          Sentry.captureException(error);
          throw error;
        }

        // Estimate cost for input tokens
        const systemPrompt = `You are ZapDev AI, an expert coding assistant with E2B integration capabilities. You specialize in creating modern web applications using Next.js 14, TypeScript, and Tailwind CSS.

Key Guidelines:
1. **Always use Next.js 14** with TypeScript when creating web applications
2. Use App Router (app directory) structure, not Pages Router
3. Include Framer Motion for smooth animations
4. Use Tailwind CSS for styling with modern gradients and glassmorphism effects
5. Implement responsive design with mobile-first approach
6. Add loading states and error boundaries
7. Use React Server Components where appropriate
8. Include proper TypeScript types and interfaces
9. Add accessibility features (ARIA labels, semantic HTML)
10. Optimize for performance with lazy loading and code splitting

When executing code with E2B:
- Explain what the code does before execution
- Show progress indicators during execution
- Display results with syntax highlighting
- Handle errors gracefully with helpful messages
- Suggest improvements or next steps

Make the output visually appealing with:
- Smooth animations using Framer Motion
- Modern UI with gradients and shadows
- Interactive elements with hover effects
- Professional color schemes
- Clear typography and spacing

Always aim to create production-ready, performant, and beautiful applications that showcase the power of Next.js and E2B integration.`;

        const fullPrompt = systemPrompt + "\n\n" + prompt;
        const estimatedInputTokens = Math.ceil(fullPrompt.length / 4);
        const estimatedOutputTokens = 8000; // Max tokens we might use
        const estimatedCost = calculateCost('openai/gpt-oss-20b', estimatedInputTokens, estimatedOutputTokens);
        
        // Check cost limit before making request
        checkCostLimit(estimatedCost);

        logger.info("Starting AI text streaming", { 
          promptLength: prompt.length,
          estimatedCost: estimatedCost.toFixed(6),
          apiKeySource
        });

        const model = getCurrentModel();
        span.setAttribute("model", "openai/gpt-oss-20b");

        const result = await streamText({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          maxTokens: 8000, // Increased token limit for openai/gpt-oss-20b
          temperature: 0.7,
        })
        
        // Add cost tracking for streaming (estimate since we don't get exact tokens upfront)
        addTodayCost(estimatedCost);

        // Record usage event (estimated for streaming)
        await recordAIConversation({
          model: 'openai/gpt-oss-20b',
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
          cost: estimatedCost,
        });
        
        logger.info("AI streaming started successfully", { 
          model: "openai/gpt-oss-20b",
          estimatedCost: estimatedCost.toFixed(6),
          dailyCost: getTodayCost().toFixed(4)
        });
        
        return result
      } catch (error) {
        logger.error("AI streaming error", { error: error instanceof Error ? error.message : String(error) });
        Sentry.captureException(error);
        
        // Try OpenRouter as failsafe
        try {
          if (!process.env.VITE_OPENROUTER_API_KEY) {
            logger.warn("OpenRouter API key not configured, cannot use failsafe");
            throw error
          }
          
          logger.info("Trying OpenRouter streaming failsafe");
          span.setAttribute("failsafe_used", true);
          span.setAttribute("failsafe_model", "qwen/qwen3-coder:free");
          
          const systemPrompt = `You are ZapDev AI, an expert coding assistant with E2B integration capabilities. You specialize in creating modern web applications using Next.js 14, TypeScript, and Tailwind CSS.`;
          
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