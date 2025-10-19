import { NextRequest } from "next/server";
import { streamText } from "ai";
import { gatewayOpenAI, defaultModelId } from "@/lib/ai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages, system, temperature } = await req.json();

  const result = await streamText({
    model: gatewayOpenAI(defaultModelId),
    system,
    temperature: typeof temperature === "number" ? temperature : 0.2,
    messages,
    maxOutputTokens: 2048,
  });

  return result.toTextStreamResponse();
}
