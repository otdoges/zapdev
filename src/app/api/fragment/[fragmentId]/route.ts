import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fragmentId: string }> }
) {
  try {
    const { fragmentId } = await params;
    const fragment = await prisma.fragment.findUnique({
      where: {
        id: fragmentId,
      },
    });

    if (!fragment) {
      return NextResponse.json(
        { error: "Fragment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(fragment);
  } catch (error) {
    console.error("[ERROR] Failed to fetch fragment:", error);
    return NextResponse.json(
      { error: "Failed to fetch fragment" },
      { status: 500 }
    );
  }
}
