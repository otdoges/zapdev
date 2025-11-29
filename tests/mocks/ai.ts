export const generateText = jest.fn(async () => ({
  text: "Mock AI response",
  toolCalls: [],
  toolResults: [],
  finishReason: "stop",
  usage: { promptTokens: 0, completionTokens: 0 },
}));

export const tool = jest.fn((config) => ({
  ...config,
  execute: config.execute,
}));

export type CoreMessage = {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; image?: string }>;
};
