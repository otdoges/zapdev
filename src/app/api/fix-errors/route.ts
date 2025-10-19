import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";

type FixErrorsRequestBody = {
  fragmentId: string;
};

function isFixErrorsRequestBody(value: unknown): value is FixErrorsRequestBody {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const fragmentId = (value as { fragmentId?: unknown }).fragmentId;
  return typeof fragmentId === "string" && fragmentId.length > 0;
}

export async function POST(request: Request) {
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

    if (!isFixErrorsRequestBody(body)) {
      return NextResponse.json(
        { error: "Fragment ID is required" },
        { status: 400 }
      );
    }

    const { fragmentId } = body;

    const fragment = await prisma.fragment.findUnique({
      where: { id: fragmentId },
      include: {
        Message: {
          include: {
            Project: true,
          },
        },
      },
    });

    if (!fragment || fragment.Message?.Project?.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await inngest.send({
      name: "error-fix/run",
      data: {
        fragmentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Error fix initiated",
    });
  } catch (error) {
    console.error("[ERROR] Failed to trigger error fix:", error);
    return NextResponse.json(
      { error: "Failed to initiate error fix" },
      { status: 500 }
    );
  }
}
