import { auth } from "@clerk/nextjs/server";
import { createRealtimeToken } from "@inngest/realtime";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!process.env.INNGEST_REALTIME_KEY && !process.env.INNGEST_EVENT_KEY) {
      console.error("[ERROR] INNGEST_REALTIME_KEY or INNGEST_EVENT_KEY not configured");
      return Response.json(
        { error: "Realtime feature not configured" },
        { status: 503 }
      );
    }

    const token = await createRealtimeToken({
      apiKey: process.env.INNGEST_REALTIME_KEY || process.env.INNGEST_EVENT_KEY!,
      userId,
      expiresAt: Date.now() + 1000 * 60 * 60,
    });

    return Response.json({ token });
  } catch (error) {
    console.error("[ERROR] Failed to generate realtime token:", error);
    return Response.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
