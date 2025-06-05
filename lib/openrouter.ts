import { OpenRouter } from '@openrouter/ai-sdk-provider';
import { CoreMessage, generateText } from 'ai';

// Model IDs provided by the user
const modelIds = [
  "deepseek/deepseek-chat:free",
  "microsoft/phi-4-reasoning-plus:free",
  "qwen/qwen3-32b:free",
  "deepseek/deepseek-r1-0528:free"
];

// Define Message and ChatHistory types compatible with the existing structure
// and Vercel AI SDK's CoreMessage
export interface Message {
  role: "user" | "model"; 
  content: string;
}
export type ChatHistory = Message[];


const getOpenRouterApiKey = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set. Please add it to your .env file.");
  }
  return apiKey;
};

// Initialize the OpenRouter provider
export const openrouterProvider = new OpenRouter({
  apiKey: getOpenRouterApiKey(),
});

export async function generateOpenRouterResponse(
  chatHistory: ChatHistory,
  systemPrompt?: string,
  modelIdFromParam?: string 
): Promise<string> {
  try {
    const selectedModelId = modelIdFromParam || modelIds[0];
    const model = openrouterProvider.chat(selectedModelId);

    const messages: CoreMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    chatHistory.forEach(msg => {
      messages.push({
        role: msg.role === "model" ? "assistant" : msg.role,
        content: msg.content,
      });
    });

    const { text } = await generateText({
      model: model,
      messages: messages,
      // Optional: Add parameters like temperature, maxTokens if needed
      // temperature: 0.7,
      // maxTokens: 4096, // Example value
    });
    
    return text;
  } catch (error) {
    console.error("Error generating response from OpenRouter:", error);
    let errorMessage = "Sorry, I encountered an error while processing your request with OpenRouter.";
    if (error instanceof Error) {
      errorMessage = error.message.includes("OPENROUTER_API_KEY") 
        ? error.message 
        : `OpenRouter Error: ${error.message}`;
    }
    // For more detailed error reporting, you might inspect the error object further
    // if (error.cause) console.error("Cause:", error.cause)
    return errorMessage;
  }
}
