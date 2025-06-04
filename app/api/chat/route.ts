import { NextResponse } from "next/server";
import { generateResponse, ChatHistory } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    // Parse request body
    const { messages, chatId } = await req.json();
    
    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }
    
    // Optional system prompt for Gemini
    const systemPrompt = `You are ZapDev AI, a helpful AI assistant focused on programming and design tasks.
    Current conversation ID: ${chatId || "unknown"}
    Today's date: ${new Date().toLocaleDateString()}`;
    
    // Generate response using Gemini
    const response = await generateResponse(messages as ChatHistory, systemPrompt);
    
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