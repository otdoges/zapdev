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

        const result = await streamText({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
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
          
          const systemPrompt = `You are ZapDev AI, an expert coding assistant with E2B integration capabilities. You specialize in creating modern web applications using Next.js 14, TypeScript, and Tailwind CSS.`;
          
          const result = await streamText({
            model: fallbackModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
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