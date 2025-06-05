import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { generateText as generateAIText } from "ai";

// Define Message and ChatHistory types
export interface Message {
  role: "user" | "model"; 
  content: string;
}
export type ChatHistory = Message[];

// Environment variables
const getGithubToken = () => {
  const token = process.env.GITHUB_TOKEN || "";
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set. Please add it to your .env.local file.");
  }
  return token;
};

// Available models from GitHub Marketplace
const modelIds = [
  "deepseek/DeepSeek-R1-0528",
  "meta/llama-3-8b-instruct",
  "mistralai/mistral-7b-instruct-v0.2",
  "xai/grok-3",
  "deepseek/deepseek-coder"
];

// Azure Client initialization
export const getAzureClient = () => {
  return ModelClient(
    "https://models.github.ai/inference",
    new AzureKeyCredential(getGithubToken())
  );
};

/**
 * Converts the chat history to the format expected by the Azure AI client
 */
export const convertChatHistory = (
  chatHistory: ChatHistory,
  systemPrompt?: string
) => {
  const messages: Array<{role: string, content: string}> = [];

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
};

/**
 * Generates a response using the Azure AI client
 */
export async function generateAzureResponse(
  chatHistory: ChatHistory,
  systemPrompt?: string,
  modelIdFromParam?: string
): Promise<string> {
  try {
    const client = getAzureClient();
    const selectedModelId = modelIdFromParam || modelIds[0];
    const messages = convertChatHistory(chatHistory, systemPrompt);

    const response = await client.path("/chat/completions").post({
      body: {
        messages,
        model: selectedModelId,
        temperature: 0.7,
        max_tokens: 4000
      }
    });

    if (isUnexpected(response)) {
      throw new Error(`Azure AI error: ${JSON.stringify(response.body.error)}`);
    }

    return response.body.choices[0].message.content;
  } catch (error) {
    console.error("Error generating response from Azure AI:", error);
    let errorMessage = "Sorry, I encountered an error while processing your request.";
    if (error instanceof Error) {
      errorMessage = `Azure AI Error: ${error.message}`;
    }
    return errorMessage;
  }
} 