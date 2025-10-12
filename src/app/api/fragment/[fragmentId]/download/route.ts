import { NextResponse } from "next/server";

import JSZip from "jszip";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    if (!fragment?.files) {
      return NextResponse.json(
        { error: "Fragment not found" },
        { status: 404 },
      );
    }

    const files = fragment.files as Record<string, unknown>;

    if (Object.keys(files).length === 0) {
      return NextResponse.json(
        { error: "No files available for download" },
        { status: 404 },
      );
    }

    const zip = new JSZip();

    for (const [path, value] of Object.entries(files)) {
      const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
      const fileContent = typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);

      zip.file(normalizedPath, fileContent);
    }

    const archive = await zip.generateAsync({ type: "nodebuffer" });
    const archiveView = new Uint8Array(archive);

    const fileName = `${(fragment.title || "fragment").replace(/[^a-z0-9-_]+/gi, "-") || "fragment"}.zip`;

    return new Response(archiveView, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("[ERROR] Failed to create fragment archive:", error);

    return NextResponse.json(
      { error: "Failed to download fragment" },
      { status: 500 },
    );
  }
}

