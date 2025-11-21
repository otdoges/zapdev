import { NextResponse } from "next/server";

export async function GET() {
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000";
    return NextResponse.json({
        issuer: baseUrl,
        jwks_uri: `${baseUrl}/.well-known/jwks.json`,
        response_types_supported: ["id_token"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
    });
}
