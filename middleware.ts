import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define truly protected routes that absolutely require authentication
  const protectedRoutes = ['/chat'];
  
  // Define routes that should bypass auth checks entirely
  const publicRoutes = ['/', '/auth', '/api', '/pricing', '/success'];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is a public route  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // Allow all public routes without any auth checks
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, do a quick cookie check first
  if (isProtectedRoute) {
    // Check for auth cookies first (much faster than API call)
    const authCookies = [
      'better-auth.session_token',
      'better-auth.session',
      '__Secure-better-auth.session_token',
      '__Host-better-auth.session_token'
    ];
    
    const hasAuthCookie = authCookies.some(cookieName => 
      request.cookies.has(cookieName) && request.cookies.get(cookieName)?.value
    );
    
    // If no auth cookies, redirect to auth immediately (no need for slow API call)
    if (!hasAuthCookie) {
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(authUrl);
    }
    
    // If we have cookies, let the request through and let client-side handle validation
    // This is much faster than server-side session validation
    return NextResponse.next();
  }
  
  // For all other routes, allow access without auth checks
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
