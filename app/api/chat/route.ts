import { NextResponse } from "next/server";
import { generateOpenRouterResponse, ChatHistory } from "@/lib/openrouter";
import { getSequentialThinkingSteps } from "@/lib/sequential-thinker";
import { systemPrompt as zapDevSystemPrompt } from "@/lib/systemprompt";

export async function POST(req: Request) {
  try {
    // Parse request body
    const { messages, chatId, modelId } = await req.json(); // Optionally allow frontend to specify modelId
    
    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }
    
// Generate sequential thinking steps
let thinkingSteps: string | null = null;
try {
  thinkingSteps = await getSequentialThinkingSteps(messages[messages.length - 1].content, modelId);
} catch (error) {
  console.error("Failed to generate sequential thinking steps:", error);
  // Continue without thinking steps
}
// Base system prompt
    let baseSystemPrompt = `You are ZapDev AI, a helpful AI assistant focused on programming and design tasks.
    Current conversation ID: ${chatId || "unknown"}
    Today's date: ${new Date().toLocaleDateString()}`;

     // Combine the detailed system prompt, base prompt, and thinking steps
    let systemPrompt = `${zapDevSystemPrompt}\n\n## Current Task Context\n${baseSystemPrompt}`;

    if (thinkingSteps) {
      systemPrompt += `\n\n## AI's Internal Thought Process (for context):\n${thinkingSteps}`;
    }
    
    // Generate response using Gemini
    const response = await generateOpenRouterResponse(messages as ChatHistory, systemPrompt, modelId);
    
    // Return the response
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in chat API route:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
} 