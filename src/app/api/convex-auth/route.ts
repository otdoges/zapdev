import { auth } from "@/lib/auth";
import { signConvexJWT } from "@/lib/convex-auth";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const convexClient = process.env.NEXT_PUBLIC_CONVEX_URL
    ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)
    : null;

// Rate limit: 60 requests per minute per user
const RATE_LIMIT_REQUESTS = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

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

    // Apply rate limiting
    if (convexClient) {
        try {
            // Sanitize user ID to prevent key collisions or bypass attempts
            const sanitizedUserId = session.user.id.replace(/[^a-zA-Z0-9-_]/g, '_');
            const rateLimitKey = `convex-auth_user_${sanitizedUserId}`;
            const rateLimitResult = await convexClient.mutation(api.rateLimit.checkRateLimit, {
                key: rateLimitKey,
                limit: RATE_LIMIT_REQUESTS,
                windowMs: RATE_LIMIT_WINDOW_MS,
            });

            if (!rateLimitResult.success) {
                return new NextResponse(
                    JSON.stringify({
                        error: "Rate limit exceeded",
                        message: rateLimitResult.message,
                        resetTime: rateLimitResult.resetTime,
                    }),
                    {
                        status: 429,
                        headers: {
                            "Content-Type": "application/json",
                            "X-RateLimit-Limit": String(RATE_LIMIT_REQUESTS),
                            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
                            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
                            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
                        },
                    }
                );
            }

            // Add rate limit headers to successful responses
            const rateLimitHeaders = {
                "X-RateLimit-Limit": String(RATE_LIMIT_REQUESTS),
                "X-RateLimit-Remaining": String(rateLimitResult.remaining),
                "X-RateLimit-Reset": String(rateLimitResult.resetTime),
            };

            // Store headers to add to response later
            (req as any).__rateLimitHeaders = rateLimitHeaders;
        } catch (error) {
            console.error("Rate limiting error:", error);
            // Continue without rate limiting on error to avoid blocking legitimate users
        }
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

    // Add rate limit headers if available
    const rateLimitHeaders = (req as any).__rateLimitHeaders || {};
    return NextResponse.json(
        { token: jwt },
        { headers: rateLimitHeaders }
    );
}
