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

// Get allowed origins for CORS
function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  
  // Allow requests from the app's own domain
  if (origin && (origin === appUrl || origin === `${appUrl}`.replace(/\/$/, ""))) {
    return origin;
  }
  
  // Also allow www subdomain variant
  const wwwVariant = appUrl.replace("://", "://www.");
  const nonWwwVariant = appUrl.replace("://www.", "://");
  
  if (origin && (origin === wwwVariant || origin === nonWwwVariant)) {
    return origin;
  }
  
  // For development, allow localhost
  if (process.env.NODE_ENV === "development" && origin?.includes("localhost")) {
    return origin;
  }
  
  // Default to app URL
  return appUrl;
}

// Add CORS headers to response
function addCorsHeaders(response: Response, origin: string): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request);
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// Wrap POST handler with rate limiting and CORS
export async function POST(request: Request) {
  const origin = getAllowedOrigin(request);
  
  try {
    // Check rate limit before processing auth request
    const rateLimitResult = await checkRateLimit(request);

    if (!rateLimitResult.success && rateLimitResult.response) {
      return addCorsHeaders(rateLimitResult.response, origin);
    }

    // Continue with original handler
    const h = getHandlers();
    const response = await h.POST(request);
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error("Auth POST handler error:", error);
    const errorResponse = new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    return addCorsHeaders(errorResponse, origin);
  }
}

// GET requests with CORS support (mostly for OAuth callbacks and session checks)
export async function GET(request: Request) {
  const origin = getAllowedOrigin(request);
  
  try {
    const h = getHandlers();
    const response = await h.GET(request);
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error("Auth GET handler error:", error);
    const errorResponse = new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    return addCorsHeaders(errorResponse, origin);
  }
}
