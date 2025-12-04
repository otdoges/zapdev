import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/frameworks",
  "/frameworks/(.*)",
  "/solutions",
  "/solutions/(.*)",
  "/showcase",
  "/ai-info",
  "/api/(.*)", // API routes should handle their own auth
]);

export default clerkMiddleware(async (auth, request) => {
  // Protected routes that require authentication
  if (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/import")
  ) {
    await auth.protect()
  }
})

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
