import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/chat(.*)', // Protect the /chat route and its sub-paths
  // Add any other routes you want to protect here
]);

const publicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
];

export default clerkMiddleware(async (auth, req) => {
  // For routes that require authentication, protect them
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  
  // No automatic redirection from home page to chat
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
