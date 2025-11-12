import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth-server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { sanitizeTextForDatabase } from "@/lib/utils";

type UpdateMessageRequestBody = {
  messageId: string;
  content: string;
  status?: "PENDING" | "STREAMING" | "COMPLETE";
};

function isUpdateMessageRequestBody(value: unknown): value is UpdateMessageRequestBody {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.messageId === "string" &&
    obj.messageId.length > 0 &&
    typeof obj.content === "string"
  );
}

export async function PATCH(request: Request) {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = user.userId || user._id.toString();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!isUpdateMessageRequestBody(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { messageId, content, status } = body;

    const sanitizedContent = sanitizeTextForDatabase(content);

    if (sanitizedContent.length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 },
      );
    }

    try {
      const updatedMessage = await fetchMutation(api.messages.updateMessage, {
        messageId: messageId as Id<"messages">,
        content: sanitizedContent,
        status: status || "STREAMING",
      });

      return NextResponse.json({
        success: true,
        message: updatedMessage,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[ERROR] Failed to update message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
