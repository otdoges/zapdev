import { auth } from "@/lib/auth";
import { signConvexJWT } from "@/lib/convex-auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return new NextResponse(null, { status: 401 });
    }

    const jwt = await signConvexJWT({
        sub: session.user.id,
        name: session.user.name,
        email: session.user.email,
        picture: session.user.image,
    });

    return NextResponse.json({ token: jwt });
}
