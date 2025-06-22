import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define routes that should bypass auth checks entirely
  const publicRoutes = ['/', '/auth', '/api', '/pricing', '/success'];
  
  // Check if the current path is a public route  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // Allow all public routes and auth callback without any checks
  if (isPublicRoute || pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }
  
  // For protected routes like /chat, let client-side handle authentication
  // This prevents middleware auth issues and lets Supabase handle auth state properly
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
