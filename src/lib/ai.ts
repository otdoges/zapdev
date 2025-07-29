import { createGroq } from '@ai-sdk/groq'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, streamText } from 'ai'

const groq = createGroq({
  apiKey: process.env.VITE_GROQ_API_KEY || '',
})

// OpenRouter as failsafe provider
const openrouter = createOpenRouter({
  apiKey: process.env.VITE_OPENROUTER_API_KEY || '',
})

// Using the Kimi K2 Instruct model - excellent for coding and reasoning
// Alternative: 'llama3-8b-8192' has higher rate limits but less advanced reasoning
export const model = groq('moonshotai/kimi-k2-instruct')

// OpenRouter failsafe model
const fallbackModel = openrouter.chat('moonshotai/kimi-k2:free')

// Alternative model for high-volume testing (uncomment if needed)
// export const model = groq('llama3-8b-8192') // Higher rate limits: 30K TPM

export async function generateAIResponse(prompt: string) {
  try {
    if (!process.env.VITE_GROQ_API_KEY) {
      throw new Error('VITE_GROQ_API_KEY is not configured. Please set your Groq API key in the environment variables.')
    }

    const { text } = await generateText({
      model,
      prompt,
      maxTokens: 4000,
      temperature: 0.7,
    })
    return text
  } catch (error) {
    console.error('AI generation error:', error)
    
    // Try OpenRouter as failsafe
    try {
      if (!process.env.VITE_OPENROUTER_API_KEY) {
        console.warn('OpenRouter API key not configured, cannot use failsafe')
        throw error
      }
      
      console.log('🔄 Trying OpenRouter failsafe...')
      const { text } = await generateText({
        model: fallbackModel,
        prompt,
        maxTokens: 4000,
        temperature: 0.7,
      })
      console.log('✅ OpenRouter failsafe succeeded')
      return text
    } catch (fallbackError) {
      console.error('OpenRouter failsafe also failed:', fallbackError)
      throw error
    }
  }
}

export async function streamAIResponse(prompt: string) {
  try {
    if (!process.env.VITE_GROQ_API_KEY) {
      throw new Error('VITE_GROQ_API_KEY is not configured. Please set your Groq API key in the environment variables.')
    }

    const result = await streamText({
      model,
      prompt,
      maxTokens: 4000,
      temperature: 0.7,
    })
    return result
  } catch (error) {
    console.error('AI streaming error:', error)
    
    // Try OpenRouter as failsafe
    try {
      if (!process.env.VITE_OPENROUTER_API_KEY) {
        console.warn('OpenRouter API key not configured, cannot use failsafe')
        throw error
      }
      
      console.log('🔄 Trying OpenRouter streaming failsafe...')
      const result = await streamText({
        model: fallbackModel,
        prompt,
        maxTokens: 4000,
        temperature: 0.7,
      })
      console.log('✅ OpenRouter streaming failsafe succeeded')
      return result
    } catch (fallbackError) {
      console.error('OpenRouter streaming failsafe also failed:', fallbackError)
      throw error
    }
  }
}