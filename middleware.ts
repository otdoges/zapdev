import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes that require authentication
  const protectedRoutes = ['/chat', '/pricing', '/success'];
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/api'];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // If it's a protected route, check authentication
  if (isProtectedRoute) {
    try {
      // Get the session from Better Auth
      const session = await auth.api.getSession({
        headers: request.headers
      });
      
      // If no session exists, redirect to auth page
      if (!session) {
        const authUrl = new URL('/auth', request.url);
        authUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(authUrl);
      }
      
      // User is authenticated, continue to the protected route
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware auth error:', error);
      // On auth error, redirect to auth page
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(authUrl);
    }
  }
  
  // For public routes or other paths, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
