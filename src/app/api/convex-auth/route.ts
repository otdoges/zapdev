import { auth } from "@/lib/auth";
import { signConvexJWT } from "@/lib/convex-auth";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const convexClient = process.env.NEXT_PUBLIC_CONVEX_URL
    ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)
    : null;

async function syncEmailVerification(session: any) {
    if (!convexClient || !session?.user?.id) return;

    try {
        await convexClient.mutation(api.users.upsertEmailVerification, {
            userId: session.user.id,
            email: typeof session.user.email === "string" ? session.user.email : undefined,
            emailVerified: Boolean(session.user.emailVerified),
            verifiedAt: session.user.emailVerified ? Date.now() : undefined,
        });
    } catch (error) {
        console.error("Failed to sync email verification state to Convex", {
            error,
            userId: session.user.id,
        });
    }
}

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return new NextResponse(null, { status: 401 });
    }

    await syncEmailVerification(session);

    if (!session.user.emailVerified) {
        return new NextResponse(
            JSON.stringify({ error: "Email verification required" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
        );
    }

    const jwt = await signConvexJWT({
        sub: session.user.id,
        name: session.user.name,
        email: session.user.email,
        picture: session.user.image,
    });

    return NextResponse.json({ token: jwt });
}
