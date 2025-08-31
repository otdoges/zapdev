import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';

const isPublicRoute = createRouteMatcher([
  '/api/sandbox-status',
  '/api/create-ai-sandbox',
  '/api/conversation-state',
  '/api/apply-ai-code-stream',
  '/api/generate-ai-code-stream',
  '/api/get-sandbox-files',
  '/api/stripe/webhook'
]);

const isProtectedRoute = createRouteMatcher([
  '/api(.*)',
]);

// Admin-only routes that require elevated permissions
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/autonomous(.*)',
  '/api/multi-agent(.*)',
  '/api/ai-system(.*)',
  '/api/performance/optimizer(.*)',
  '/api/monitor/realtime(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Handle admin routes
  if (isAdminRoute(req)) {
    const { userId } = await auth.protect();
    
    if (!userId) {
      // Redirect to sign-in for admin routes
      if (req.nextUrl.pathname.startsWith('/admin')) {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirectUrl', req.nextUrl.pathname);
        return NextResponse.redirect(signInUrl);
      }
      
      // Return 401 for API routes
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', adminRequired: true }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check admin permissions
    const hasAdminAccess = await isAdmin(userId);
    if (!hasAdminAccess) {
      // Redirect to home for admin pages
      if (req.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      // Return 403 for API routes
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden: Admin access required', adminRequired: true }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Handle regular protected routes
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};