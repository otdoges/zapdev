import { createGroq } from '@ai-sdk/groq'
import { generateText, streamText } from 'ai'

const groq = createGroq({
  apiKey: process.env.VITE_GROQ_API_KEY || '',
})

export const model = groq('moonshotai/kimi-k2-instruct')

export async function generateAIResponse(prompt: string) {
  try {
    const { text } = await generateText({
      model,
      prompt,
      maxTokens: 4000,
      temperature: 0.7,
    })
    return text
  } catch (error) {
    console.error('AI generation error:', error)
    throw error
  }
}

export async function streamAIResponse(prompt: string) {
  try {
    const result = await streamText({
      model,
      prompt,
      maxTokens: 4000,
      temperature: 0.7,
    })
    return result
  } catch (error) {
    console.error('AI streaming error:', error)
    throw error
  }
}