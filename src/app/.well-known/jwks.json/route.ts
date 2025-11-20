import { getJWKS } from "@/lib/convex-auth";
import { NextResponse } from "next/server";

export async function GET() {
    const jwks = await getJWKS();
    return NextResponse.json(jwks);
}
