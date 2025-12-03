import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

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

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Redirect authenticated users away from dashboard if not authenticated
  // All other routes are public or handle their own auth
  const isAuthenticatedUser = await convexAuth.isAuthenticated();

  // Protected routes that require authentication
  if (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/import")
  ) {
    if (!isAuthenticatedUser) {
      // Redirect to home page where auth modal can be shown
      return nextjsMiddlewareRedirect(request, "/");
    }
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
