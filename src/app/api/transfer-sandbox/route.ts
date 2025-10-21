import { NextResponse } from "next/server";

import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fragmentId } = body;

    if (!fragmentId) {
      return NextResponse.json(
        { error: "Fragment ID is required" },
        { status: 400 }
      );
    }

    await inngest.send({
      name: "sandbox-transfer/run",
      data: {
        fragmentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sandbox resume initiated",
    });
  } catch (error) {
    console.error("[ERROR] Failed to resume sandbox:", error);
    return NextResponse.json(
      { error: "Failed to resume sandbox" },
      { status: 500 }
    );
  }
}
