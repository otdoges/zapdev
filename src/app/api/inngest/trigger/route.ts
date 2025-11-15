import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { getAgentEventName } from "@/lib/agent-mode";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, value, model } = body;

    console.log("[Inngest Trigger] Received request:", {
      projectId,
      valueLength: value?.length || 0,
      model,
      timestamp: new Date().toISOString(),
    });

    if (!projectId || !value) {
      console.error("[Inngest Trigger] Missing required fields:", {
        hasProjectId: !!projectId,
        hasValue: !!value,
      });
      return NextResponse.json(
        { error: "Missing required fields: projectId and value" },
        { status: 400 }
      );
    }

    const eventName = getAgentEventName();
    console.log("[Inngest Trigger] Sending event:", {
      eventName,
      projectId,
      model: model || "auto",
    });

    await inngest.send({
      name: eventName,
      data: {
        value,
        projectId,
        model: model || "auto", // Default to "auto" if not specified
      },
    });

    console.log("[Inngest Trigger] Event sent successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Inngest Trigger] Failed to trigger event:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { 
        error: "Failed to trigger event",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
