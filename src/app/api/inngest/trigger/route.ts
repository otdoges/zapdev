import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { getAgentEventName } from "@/lib/agent-mode";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, value } = body;

    if (!projectId || !value) {
      return NextResponse.json(
        { error: "Missing required fields: projectId and value" },
        { status: 400 }
      );
    }

    await inngest.send({
      name: getAgentEventName(),
      data: {
        value,
        projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to trigger Inngest event:", error);
    return NextResponse.json(
      { error: "Failed to trigger event" },
      { status: 500 }
    );
  }
}
