import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        Project: true,
      },
    });

    if (!message || message.Project.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: sanitizedContent,
        status: status || "STREAMING",
      },
    });

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error("[ERROR] Failed to update message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
