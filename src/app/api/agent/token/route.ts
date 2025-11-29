import { getUser } from "@/lib/auth-server";

export async function POST() {
  try {
    const user = await getUser();
    
    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Realtime token generation is handled via AI SDK streaming
    // This endpoint is a placeholder for future realtime features
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
