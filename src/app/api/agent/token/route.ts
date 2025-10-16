import { auth } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Placeholder: Inngest realtime token disabled; implement provider when available
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[ERROR] Failed to generate realtime token:", error);
    return Response.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
