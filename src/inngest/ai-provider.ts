import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { Message } from "@inngest/agent-kit";
import { openai as createAgentModel } from "@inngest/agent-kit";

export interface AIProviderConfig {
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature?: number;
  frequencyPenalty?: number;
}

const aiGateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseURL: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
});

export const createAIModel = (config: AIProviderConfig) => {
  const model = aiGateway(config.model);

  return {
    model: config.model,
    async complete(messages: Message[], options?: { temperature?: number; tools?: Record<string, unknown>[] }) {
      try {
        const formattedMessages = messages.map((msg) => {
          if (msg.type === "text") {
            return {
              role: msg.role as "user" | "assistant" | "system",
              content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
            };
          }
          return {
            role: "user" as const,
            content: JSON.stringify(msg),
          };
        });

        const result = await generateText({
          model,
          messages: formattedMessages,
          temperature: options?.temperature ?? config.temperature ?? 0.7,
          frequencyPenalty: config.frequencyPenalty,
        });

        return {
          content: result.text,
          toolCalls: result.toolCalls || [],
          finishReason: result.finishReason,
        };
      } catch (error) {
        console.error("[AI Provider Error]:", error);
        throw error;
      }
    },
  };
};

export const geminiFlashModel = createAIModel({
  model: "google/gemini-2.5-flash-lite",
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
  temperature: 0.3,
});

export const kimiK2Model = createAIModel({
  model: "moonshotai/kimi-k2-0905",
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
  temperature: 0.7,
  frequencyPenalty: 0.5,
});

export const kimiK2ErrorFixModel = createAIModel({
  model: "moonshotai/kimi-k2-0905",
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
  temperature: 0.5,
  frequencyPenalty: 0.5,
});

export const createAgentModelConfig = (modelName: string, temperature: number, frequencyPenalty?: number) => {
  return createAgentModel({
    model: modelName,
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
    defaultParameters: {
      temperature,
      ...(frequencyPenalty && { frequency_penalty: frequencyPenalty }),
    },
  });
};

export const geminiFlashAgentModel = () =>
  createAgentModelConfig("google/gemini-2.5-flash-lite", 0.3);

export const kimiK2AgentModel = () =>
  createAgentModelConfig("moonshotai/kimi-k2-0905", 0.7, 0.5);

export const kimiK2ErrorFixAgentModel = () =>
  createAgentModelConfig("moonshotai/kimi-k2-0905", 0.5, 0.5);
