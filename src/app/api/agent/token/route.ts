import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate a realtime token for this user
    const token = await inngest.createRealtimeToken({
      user: userId,
      expiresIn: "1h",
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
