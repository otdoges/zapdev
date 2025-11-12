import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth-server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID;
const FIGMA_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/import/figma/callback`;

export async function GET() {
  const token = await getToken();
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = user.userId || user._id.toString();

  if (!FIGMA_CLIENT_ID) {
    return NextResponse.json(
      { error: "Figma OAuth not configured" },
      { status: 500 }
    );
  }

  // Generate state token for CSRF protection
  const state = Buffer.from(
    JSON.stringify({ userId, timestamp: Date.now() })
  ).toString("base64");

  const params = new URLSearchParams({
    client_id: FIGMA_CLIENT_ID,
    redirect_uri: FIGMA_REDIRECT_URI,
    scope: "file_read",
    state,
    response_type: "code",
  });

  const figmaAuthUrl = `https://www.figma.com/oauth?${params.toString()}`;

  return NextResponse.redirect(figmaAuthUrl);
}
