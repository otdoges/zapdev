import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/pricing',
  '/api/auth', // Better Auth endpoints
];

// Allowed origins for CORS
const allowedOrigins = [
  'https://zapdev.link',
  'https://www.zapdev.link',
];

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

// Check if origin is allowed
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // Handle CORS for auth endpoints
  if (pathname.startsWith('/api/auth')) {
    const response = NextResponse.next();

    if (isOriginAllowed(origin) && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return response;
    }

    return response;
  }

  // Allow all API routes and public routes
  if (pathname.startsWith('/api') || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, the authentication check will be handled by Better Auth
  // at the component/page level using the authClient hooks
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
