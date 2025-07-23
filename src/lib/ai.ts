import { generateText, streamText } from 'ai'
import { groq, DEFAULT_MODEL, type GroqModelId } from './groq'
import { ZAPDEV_SYSTEM_PROMPT } from './system-prompt'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string // Changed to string to support all model types
}

export interface ChatOptions {
  model?: GroqModelId
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  useAdvancedPrompt?: boolean
}

// Generate a single response
export const generateResponse = async (
  messages: ChatMessage[],
  options: ChatOptions = {}
) => {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 4000,
    systemPrompt,
    useAdvancedPrompt = true
  } = options

  const finalSystemPrompt = systemPrompt || (useAdvancedPrompt ? ZAPDEV_SYSTEM_PROMPT : "You are a helpful AI assistant that specializes in web development and coding. You can help users build websites, web applications, and provide code examples.")

  const formattedMessages = [
    {
      role: 'system' as const,
      content: finalSystemPrompt
    },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ]

  try {
    const result = await generateText({
      model: groq(model),
      messages: formattedMessages,
      temperature,
      maxTokens,
    })

    return {
      content: result.text,
      model,
      usage: result.usage,
      error: null
    }
  } catch (error) {
    console.error('Error generating response:', error)
    return {
      content: '',
      model,
      usage: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Stream a response
export const streamResponse = async (
  messages: ChatMessage[],
  options: ChatOptions = {}
) => {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 4000,
    systemPrompt,
    useAdvancedPrompt = true
  } = options

  const finalSystemPrompt = systemPrompt || (useAdvancedPrompt ? ZAPDEV_SYSTEM_PROMPT : "You are a helpful AI assistant that specializes in web development and coding. You can help users build websites, web applications, and provide code examples.")

  const formattedMessages = [
    {
      role: 'system' as const,
      content: finalSystemPrompt
    },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ]

  try {
    const result = await streamText({
      model: groq(model),
      messages: formattedMessages,
      temperature,
      maxTokens,
    })

    return {
      textStream: result.textStream,
      model,
      error: null
    }
  } catch (error) {
    console.error('Error streaming response:', error)
    return {
      textStream: null,
      model,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Code generation specific prompt
export const generateCode = async (
  prompt: string,
  language: string = 'typescript',
  options: ChatOptions = {}
) => {
  const codeSystemPrompt = `${ZAPDEV_SYSTEM_PROMPT}

## SPECIFIC TASK: CODE GENERATION

You are specifically asked to generate ${language} code. Follow these additional guidelines:

1. **Generate clean, modern, and production-ready code**
2. **Use best practices for ${language}**
3. **Include proper error handling and TypeScript types**
4. **Add helpful comments for complex logic**
5. **Make the code responsive and accessible when applicable**
6. **Use modern frameworks and libraries appropriately**
7. **Ensure proper imports and exports**
8. **Include proper testing considerations**

Generate complete, runnable code that follows all the principles outlined in your core system prompt.`

  const messages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: `Generate ${language} code for: ${prompt}`,
      timestamp: new Date()
    }
  ]

  return generateResponse(messages, {
    ...options,
    systemPrompt: codeSystemPrompt,
    useAdvancedPrompt: false // We're using the custom system prompt
  })
}

// Website generation specific prompt
export const generateWebsite = async (
  description: string,
  options: ChatOptions = {}
) => {
  const webSystemPrompt = `${ZAPDEV_SYSTEM_PROMPT}

## SPECIFIC TASK: WEBSITE GENERATION

You are specifically asked to create a complete website. Follow these additional guidelines:

1. **Generate complete HTML, CSS, and JavaScript code**
2. **Use modern CSS techniques (Flexbox, Grid, CSS Variables)**
3. **Make it fully responsive for all devices**
4. **Include proper semantic HTML structure**
5. **Add smooth animations and interactions**
6. **Use a modern, professional design aesthetic**
7. **Include proper accessibility features (ARIA labels, semantic elements)**
8. **Generate clean, well-structured code with proper organization**
9. **Use Tailwind CSS for styling when possible**
10. **Include proper meta tags and SEO considerations**
11. **Implement proper performance optimizations**
12. **Add proper error handling and loading states**

Generate a complete, working website that can be directly used and follows all the principles outlined in your core system prompt.`

  const messages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: `Create a website for: ${description}`,
      timestamp: new Date()
    }
  ]

  return generateResponse(messages, {
    ...options,
    systemPrompt: webSystemPrompt,
    maxTokens: 8000, // Larger limit for website generation
    useAdvancedPrompt: false // We're using the custom system prompt
  })
}