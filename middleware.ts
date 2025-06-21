import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  
  // For protected routes, check for Supabase auth
  if (isProtectedRoute) {
    // Check for Supabase auth tokens
    const supabaseAccessToken = request.cookies.get('sb-access-token')?.value;
    const supabaseRefreshToken = request.cookies.get('sb-refresh-token')?.value;
    
    // If no auth tokens, redirect to auth immediately
    if (!supabaseAccessToken && !supabaseRefreshToken) {
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(authUrl);
    }
    
    // If we have tokens, let the request through and let client-side handle validation
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
