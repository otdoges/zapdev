import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "edge";

export async function GET(_req: Request) {
  const url = new URL(_req.url);
  const match = url.pathname.match(/\/projects\/([^/]+)/);
  const projectId = match?.[1] ?? "";
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  const title = project?.name ?? "Project";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #0b0b0b 0%, #23262f 100%)",
          color: "white",
          padding: 80,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700 }}>Zapdev</div>
        <div style={{ fontSize: 42, marginTop: 8 }}>{title}</div>
        <div style={{ fontSize: 20, opacity: 0.6, marginTop: 6 }}>
          Build Fast, Scale Smart
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
