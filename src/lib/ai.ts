import { createOpenAI } from "@ai-sdk/openai";

const rawBaseUrl = process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1";
const baseURL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export const gatewayOpenAI = createOpenAI({
  baseURL,
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export const defaultModelId = "openai/gpt-4o-mini";
