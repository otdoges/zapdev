import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { checkRateLimit } from "@/lib/rate-limit";

let handlers: ReturnType<typeof toNextJsHandler> | null = null;

function getHandlers() {
  if (!handlers) {
    handlers = toNextJsHandler(auth);
  }
  return handlers;
}

// Wrap POST handler with rate limiting
export async function POST(request: Request) {
  try {
    // Check rate limit before processing auth request
    const rateLimitResult = await checkRateLimit(request);

    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    // Continue with original handler
    const h = getHandlers();
    return h.POST(request);
  } catch (error) {
    console.error("Auth POST handler error:", error);
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// GET requests don't need rate limiting (mostly for OAuth callbacks)
export async function GET(request: Request) {
  try {
    const h = getHandlers();
    return h.GET(request);
  } catch (error) {
    console.error("Auth GET handler error:", error);
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
