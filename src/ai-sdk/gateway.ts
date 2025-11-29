import { createGateway } from "@ai-sdk/gateway";

export const gateway = createGateway({
  baseURL: process.env.AI_GATEWAY_BASE_URL || "https://gateway.ai.vercel.sh/v1",
  headers: {
    Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
  },
});
