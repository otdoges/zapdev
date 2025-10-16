import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { siteConfig } from "@/seo/config";

export const runtime = "edge";
export const alt = siteConfig.siteName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || siteConfig.siteName;
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0F19",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: 64,
            gap: 24,
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 28, opacity: 0.8 }}>{siteConfig.siteDescription}</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
