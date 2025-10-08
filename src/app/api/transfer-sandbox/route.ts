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

    // Trigger the sandbox transfer Inngest function
    await inngest.send({
      name: "sandbox-transfer/run",
      data: {
        fragmentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sandbox transfer initiated",
    });
  } catch (error) {
    console.error("[ERROR] Failed to trigger sandbox transfer:", error);
    return NextResponse.json(
      { error: "Failed to initiate sandbox transfer" },
      { status: 500 }
    );
  }
}
