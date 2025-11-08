import { NextResponse } from "next/server";

import { inngest } from "@/inngest/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let limit = 1;
    try {
      const body = await request.json();
      if (typeof body?.limit === "number") {
        limit = Math.max(1, Math.min(5, Math.floor(body.limit)));
      }
    } catch {
      // no body provided
    }

    await inngest.send({
      name: "10x-swe/task-queue",
      data: { limit },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[task-queue] failed to trigger", error);
    return NextResponse.json({ error: "Failed to trigger queue" }, { status: 500 });
  }
}
