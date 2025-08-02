import { createGroq } from '@ai-sdk/groq'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, streamText } from 'ai'
import * as Sentry from '@sentry/react'

const { logger } = Sentry;

// Get user's API key from localStorage if available
function getUserApiKey(): string | null {
  try {
    const savedConfig = localStorage.getItem('zapdev-api-config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      return config.useUserApiKey && config.groqApiKey ? config.groqApiKey : null;
    }
  } catch (error) {
    console.error('Error reading API config from localStorage:', error);
  }
  return null;
}

// Create Groq instance with user key or fallback to env key
function createGroqInstance() {
  const userApiKey = getUserApiKey();
  const apiKey = userApiKey || process.env.VITE_GROQ_API_KEY || '';
  
  if (userApiKey) {
    console.log('🔑 Using user-provided Groq API key');
  } else if (process.env.VITE_GROQ_API_KEY) {
    console.log('🔑 Using environment Groq API key');
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
  return groq('moonshotai/kimi-k2-instruct');
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
        
        span.setAttribute("prompt_length", prompt.length);
        span.setAttribute("api_key_source", userApiKey ? "user" : "env");
        
        if (!userApiKey && !envApiKey) {
          const error = new Error('No Groq API key configured. Please add your API key in Settings or set VITE_GROQ_API_KEY in environment variables.');
          Sentry.captureException(error);
          throw error;
        }

        logger.info("Starting AI text generation", { 
          promptLength: prompt.length,
          apiKeySource: userApiKey ? "user" : "env"
        });

        const model = getCurrentModel();
        span.setAttribute("model", "moonshotai/kimi-k2-instruct");
        
        const { text } = await generateText({
          model,
          prompt,
          maxTokens: 4000,
          temperature: 0.7,
        })
        
        span.setAttribute("response_length", text.length);
        logger.info("AI text generation completed", { 
          responseLength: text.length,
          model: "moonshotai/kimi-k2-instruct"
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
        
        span.setAttribute("prompt_length", prompt.length);
        span.setAttribute("api_key_source", userApiKey ? "user" : "env");
        
        if (!userApiKey && !envApiKey) {
          const error = new Error('No Groq API key configured. Please add your API key in Settings or set VITE_GROQ_API_KEY in environment variables.');
          Sentry.captureException(error);
          throw error;
        }

        logger.info("Starting AI text streaming", { 
          promptLength: prompt.length,
          apiKeySource: userApiKey ? "user" : "env"
        });

        const model = getCurrentModel();
        span.setAttribute("model", "moonshotai/kimi-k2-instruct");
        
        const result = await streamText({
          model,
          prompt,
          maxTokens: 4000,
          temperature: 0.7,
        })
        
        logger.info("AI streaming started successfully", { 
          model: "moonshotai/kimi-k2-instruct"
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
          
          const result = await streamText({
            model: fallbackModel,
            prompt,
            maxTokens: 4000,
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