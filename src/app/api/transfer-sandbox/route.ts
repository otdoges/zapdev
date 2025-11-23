import { NextResponse } from "next/server";
import { getConvexClientWithAuth } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function POST(request: Request) {
  try {
    const convexClient = await getConvexClientWithAuth();
    const body = await request.json();
    const { fragmentId } = body as { fragmentId?: string };

    if (!fragmentId) {
      return NextResponse.json(
        { error: "Fragment ID is required" },
        { status: 400 },
      );
    }

    const fragmentData = await convexClient.query(
      api.messages.getFragmentByIdAuth,
      { fragmentId: fragmentId as Id<"fragments"> },
    );

    if (!fragmentData?.fragment?.sandboxId || !fragmentData?.project?.userId) {
      return NextResponse.json(
        { error: "Fragment has no sandbox or invalid project data" },
        { status: 400 },
      );
    }

    const sandboxUrl = `https://${fragmentData.fragment.sandboxId}.sandbox.e2b.dev`;

    await convexClient.mutation(api.messages.createFragmentForUser, {
      userId: fragmentData.project.userId,
      messageId: fragmentData.fragment.messageId as Id<"messages">,
      sandboxId: fragmentData.fragment.sandboxId,
      sandboxUrl,
      title: fragmentData.fragment.title || "Fragment",
      files: fragmentData.fragment.files,
      framework: fragmentData.fragment.framework,
      metadata: fragmentData.fragment.metadata,
    });

    return NextResponse.json({
      success: true,
      sandboxId: fragmentData.fragment.sandboxId,
      sandboxUrl,
    });
  } catch (error) {
    console.error("[ERROR] Failed to resume sandbox:", error);
    return NextResponse.json(
      { error: "Failed to resume sandbox" },
      { status: 500 },
    );
  }
}
