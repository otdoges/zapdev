import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

// Public routes that don't require authentication
const publicPaths = [
  "/",
  "/sign-in",
  "/sign-up",
  "/pricing",
  "/api/auth",
  "/api/polar/webhooks",
  "/terms",
  "/privacy",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie) {
    // Redirect to sign-in if no session
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Validate session exists and is not expired
  try {
    const session = await fetchQuery(api.sessions.getByToken, { 
      token: sessionCookie.value 
    });
    
    // Note: convex/sessions.ts:getByToken already filters out expired sessions (line 38-42)
    // If session is null, it's either invalid or expired
    if (!session) {
      console.warn("Invalid or expired session detected", {
        path: pathname,
        timestamp: new Date().toISOString(),
      });
      
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      
      const response = NextResponse.redirect(signInUrl);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  } catch (error) {
    console.error("Session validation failed:", error);
    
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    
    const response = NextResponse.redirect(signInUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
