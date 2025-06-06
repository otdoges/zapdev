import { streamText } from 'ai';
import { enhancePromptWithGemini } from '@/lib/gemini';
import { OpenRouter } from '@openrouter/ai-sdk-provider';

// IMPORTANT: Set the runtime to edge
export const runtime = 'edge';

// Check for OpenRouter API key
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY is not set. API calls may fail.');
}

// Initialize OpenRouter provider
const openrouterProvider = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, chatId } = await req.json();
  
  try {
    // Get the last user message
    const lastUserMessage = messages.findLast((msg: any) => msg.role === 'user');
    
    let processedMessages = [...messages];
    
    // If there's a user message and it contains design-related content, enhance it
    if (lastUserMessage) {
      // Check if this is likely a design-related prompt
      const isDesignPrompt = /design|UI|interface|layout|website|page|component|style|color|theme/i.test(lastUserMessage.content);
      
      if (isDesignPrompt) {
        try {
          // Enhance the prompt with Gemini
          const enhancedPrompt = await enhancePromptWithGemini(lastUserMessage.content);
          
          // Replace the last user message with the enhanced version and add system context
          processedMessages = [
            ...messages.slice(0, -1),
            {
              role: 'system',
              content: `The following is an enhanced version of the user's prompt created by Gemini. Use this enhanced prompt to generate better UI design advice and code.`
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ];
        } catch (error) {
          console.error('Error enhancing prompt:', error);
          // Continue with original messages on error
        }
      }
    }
    
    // Add system message for code generation behavior
    processedMessages.unshift({
      role: 'system',
      content: `You are a design and coding assistant. When suggesting code, don't display it directly in the chat. 
      Instead, explain that you're preparing the code in a Monaco editor for the user to review. 
      When you need to show code, say something like: "I've prepared the code in the preview editor. Please review it."
      This will signal to our frontend that code should be displayed in the separate Monaco editor panel.
      When collaborating on design tasks, mention that you're working with Gemini to enhance the design prompts for better results.`
    });

    // Choose a model from OpenRouter (claude-3-opus or a similar powerful model)
    // You can also specify a model via query parameter later
    const model = openrouterProvider.chat('anthropic/claude-3-opus:beta');

    // Create text stream using the AI SDK with OpenRouter
    const textStream = streamText({
      model: model,
      messages: processedMessages.map((message: any) => ({
        role: message.role === 'model' ? 'assistant' : message.role,
        content: message.content,
      })),
      temperature: 0.7,
      maxTokens: 1500,
    });

    // Convert the text stream to a response with the appropriate headers
    return new Response(textStream.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    // If we hit an error, return a 500 error with the error message
    console.error('Error in chat API route:', error);
    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request. Please make sure you have set up your OpenRouter API key correctly.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 