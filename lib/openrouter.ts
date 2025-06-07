import { OpenRouter } from '@openrouter/ai-sdk-provider';
import { CoreMessage, streamText, generateText } from 'ai';

// Model IDs available for selection
export const modelIds = [
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
  const apiKey = process.env.NEXT_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_OPENROUTER_API_KEY environment variable is not set. Please add it to your .env file.");
  }
  return apiKey;
};

// Initialize the OpenRouter provider
export const openrouterProvider = new OpenRouter({
  apiKey: getOpenRouterApiKey(),
});

// --- System Prompts ---
const defaultSystemPrompt = `You are a world-class AI assistant. Provide concise, helpful, and accurate responses.`;

const thinkingSystemPrompt = `You are a powerful AI assistant that thinks step-by-step to arrive at the best possible response. 
Before providing your final answer, outline your thought process. 
For example:
1.  **Analyze the Request**: Break down the user's query.
2.  **Formulate a Plan**: Create a plan to address the query.
3.  **Execute the Plan**: Follow the plan to generate the response.
4.  **Final Answer**: Provide the final, polished answer.
This helps the user understand your reasoning and improves the quality of your response.`;


function prepareMessages(chatHistory: ChatHistory, systemPrompt?: string): CoreMessage[] {
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

    return messages;
}


export async function streamOpenRouterResponse({
    chatHistory,
    modelId,
    useThinking,
   temperature = 0.7,
   maxTokens = 4096,
}: {
    chatHistory: ChatHistory;
    modelId?: string;
    useThinking?: boolean;
   temperature?: number;
   maxTokens?: number;
}) {
    if (!modelId && modelIds.length === 0) {
        throw new Error("No model ID provided and no default models available");
    }
    const selectedModelId = modelId || modelIds[0];
    const model = openrouterProvider.chat(selectedModelId);
    
    const systemPrompt = useThinking ? thinkingSystemPrompt : defaultSystemPrompt;
    const messages = prepareMessages(chatHistory, systemPrompt);

    return await streamText({
        model,
        messages,
       temperature,
       maxTokens,
    });
}

export async function generateOpenRouterResponse(
  chatHistory: ChatHistory,
  systemPrompt?: string,
  modelIdFromParam?: string 
): Promise<string> {
  try {
    const selectedModelId = modelIdFromParam || (modelIds.length > 0 ? modelIds[0] : "deepseek/deepseek-chat:free");
    const model = openrouterProvider.chat(selectedModelId);

    const messages = prepareMessages(chatHistory, systemPrompt);

    const { text } = await generateText({
      model: model,
      messages: messages,
    });
    
    return text;
  } catch (error) {
    console.error("Error generating response from OpenRouter:", error);
    let errorMessage = "Sorry, I encountered an error while processing your request with OpenRouter.";
    if (error instanceof Error) {
      if (error.message.includes("NEXT_OPENROUTER_API_KEY")) {
        errorMessage = "The OpenRouter API key is not configured correctly. Please check your environment variables.";
      } else {
        errorMessage = `OpenRouter Error: ${error.message}`;
      }
    }
    return errorMessage;
  }
}
