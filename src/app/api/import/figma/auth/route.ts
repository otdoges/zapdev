import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-server";
import { createOAuthState } from "@/lib/oauth-state";

const FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID;
const FIGMA_REDIRECT_URI = process.env.NODE_ENV === "production"
  ? "https://zapdev.link/api/import/figma/callback"
  : "http://localhost:3000/api/import/figma/callback";

export async function GET() {
  const stackUser = await getUser();
  
  if (!stackUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = stackUser.id;

  if (!FIGMA_CLIENT_ID) {
    return NextResponse.json(
      { error: "Figma OAuth not configured" },
      { status: 500 }
    );
  }

  // Generate HMAC-signed state token for CSRF protection
  const state = createOAuthState(userId);

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
