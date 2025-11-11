import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { checkRateLimit } from "@/lib/rate-limit";

// Get the original handlers
const handlers = toNextJsHandler(auth);

// Wrap POST handler with rate limiting
export async function POST(request: Request, context: any) {
  // Check rate limit before processing auth request
  const rateLimitResult = await checkRateLimit(request);
  
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  
  // Continue with original handler
  return handlers.POST(request, context);
}

// GET requests don't need rate limiting (mostly for OAuth callbacks)
export const GET = handlers.GET;
