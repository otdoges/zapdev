import { gateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import type { Message } from "@inngest/agent-kit";
import { openai as createAgentModel } from "@inngest/agent-kit";

export interface AIProviderConfig {
  modelName: string;
  temperature?: number;
  frequencyPenalty?: number;
}

export const createAIModel = (config: AIProviderConfig) => {
  const model = gateway(config.modelName);

  return {
    model: config.modelName,
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

        // Type assertion needed for LanguageModelV2 compatibility with ai@4.3.19
        // The gateway provider returns LanguageModelV2 which is compatible with generateText
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await generateText({
          model: model as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
  modelName: "google/gemini-2.5-flash-lite",
  temperature: 0.3,
});

export const kimiK2Model = createAIModel({
  modelName: "moonshotai/kimi-k2-0905",
  temperature: 0.7,
  frequencyPenalty: 0.5,
});

export const kimiK2ErrorFixModel = createAIModel({
  modelName: "moonshotai/kimi-k2-0905",
  temperature: 0.5,
  frequencyPenalty: 0.5,
});

export const createAgentModelConfig = (modelName: string, temperature: number, frequencyPenalty?: number) => {
  return createAgentModel({
    model: modelName,
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: "https://ai-gateway.vercel.sh/v1",
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
