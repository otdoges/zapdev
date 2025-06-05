import { NextResponse } from "next/server";
import { generateOpenRouterResponse, ChatHistory } from "@/lib/openrouter";
import { getSequentialThinkingSteps } from "@/lib/sequential-thinker";
import { systemPrompt as zapDevSystemPrompt } from "@/lib/systemprompt";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { headers } from "next/headers";

/**
 * API route for generating AI chat responses.
 * @param req The incoming request, expected to contain a JSON body with the following properties:
 * - `messages`: An array of messages in the chat, where each message is an object with `role` and `content` properties.
 * - `chatId`: The ID of the chat, used to generate a unique system prompt.
 * - `modelId`: The ID of the AI model to use for generating responses, if specified.
 * @returns A JSON response containing the generated AI response.
 */
export async function POST(req: Request) {
  try {
    // Check if the request is multipart form data
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");
    
    let messages: ChatHistory;
    let chatId: string;
    let modelId: string | undefined;
    let uploadedFiles: { name: string; path: string; type: string }[] = [];
    
    if (isFormData) {
      const formData = await req.formData();
      
      // Parse the messages from the form data
      const messagesJson = formData.get("messages");
      if (typeof messagesJson !== "string") {
        return NextResponse.json(
          { error: "Messages not found in form data" },
          { status: 400 }
        );
      }
      
      messages = JSON.parse(messagesJson);
      chatId = formData.get("chatId") as string;
      modelId = formData.get("modelId") as string | undefined;
      
      // Handle file uploads
      const fileKeys = Array.from(formData.keys()).filter(key => key.startsWith("file"));
      
      if (fileKeys.length > 0) {
        // Ensure uploads directory exists for this chat
        const uploadsDir = join(process.cwd(), "public", "uploads", chatId);
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }
        
        // Process each file
        for (const key of fileKeys) {
          const file = formData.get(key) as File;
          if (!file) continue;
          
          // Generate a unique filename to prevent collisions
          const uniqueFilename = `${uuidv4()}-${file.name}`;
          const filePath = join(uploadsDir, uniqueFilename);
          
          // Convert file to buffer and write to disk
          const buffer = Buffer.from(await file.arrayBuffer());
          await writeFile(filePath, buffer);
          
          // Add file info to the uploadedFiles array
          uploadedFiles.push({
            name: file.name,
            path: `/uploads/${chatId}/${uniqueFilename}`,
            type: file.type
          });
        }
      }
    } else {
      // Handle regular JSON requests
      const { messages: msgs, chatId: id, modelId: model } = await req.json();
      messages = msgs;
      chatId = id;
      modelId = model;
    }
    
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
    
    // Add file information to the system prompt if files were uploaded
    if (uploadedFiles.length > 0) {
      baseSystemPrompt += `\n\nUser has uploaded ${uploadedFiles.length} file(s):`;
      uploadedFiles.forEach(file => {
        baseSystemPrompt += `\n- ${file.name} (${file.type}) - Available at ${file.path}`;
      });
    }

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