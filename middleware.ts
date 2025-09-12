import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware

// Define which routes are public
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/search",
  "/api/detect-model",
  "/api/lint-and-fix",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Webhooks should generally be unprotected
  "/api/webhooks(.*)",
]);

// Edge-compatible Clerk middleware
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};