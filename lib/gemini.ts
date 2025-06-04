import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

// Initialize the Google Generative AI client with API key
const getApiKey = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY environment variable is not set");
  }
  return apiKey;
};

// Get the Gemini model name from environment variables
const getModelName = () => {
  return process.env.GEMINI_MODEL_NAME || "gemini-1.5-pro";
};

// Initialize the Google Generative AI client
export const initGoogleAI = () => {
  try {
    const apiKey = getApiKey();
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error("Failed to initialize Google AI:", error);
    throw error;
  }
};

// Configure safety settings for the model
export const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export interface Message {
  role: "user" | "model";
  content: string;
}

export type ChatHistory = Message[];

// Generate a response from Gemini model
export async function generateResponse(
  chatHistory: ChatHistory,
  systemPrompt?: string
): Promise<string> {
  try {
    const genAI = initGoogleAI();
    const model = genAI.getGenerativeModel({ model: getModelName() });
    
    // Prepare the chat
    const chat = model.startChat({
      safetySettings,
      history: chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    // Add system prompt if provided
    if (systemPrompt) {
      await chat.sendMessage([{ text: systemPrompt }]);
    }

    // Get last user message
    const lastUserMessage = chatHistory[chatHistory.length - 1];
    
    // Generate response
    const result = await chat.sendMessage([{ text: lastUserMessage.content }]);
    const response = result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error generating response:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
} 