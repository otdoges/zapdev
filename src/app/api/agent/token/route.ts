import { requireSession } from "@/lib/auth-server";

export async function POST() {
  try {
    const session = await requireSession();

    if (!session.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Realtime token generation is not available without @inngest/realtime middleware
    // TODO: Install @inngest/realtime if needed
    return Response.json(
      { error: "Realtime feature not configured" },
      { status: 503 }
    );
  } catch (error) {
    console.error("[ERROR] Failed to generate realtime token:", error);
    return Response.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
