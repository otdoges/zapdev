import { authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";

const missingWorkOSEnv = [
  "WORKOS_API_KEY",
  "WORKOS_CLIENT_ID",
  "WORKOS_COOKIE_PASSWORD",
  "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
].filter((key) => !process.env[key]);

const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD || "";
const hasValidCookiePassword = cookiePassword.length >= 32;

const isWorkOSConfigured =
  missingWorkOSEnv.length === 0 && hasValidCookiePassword;

// If WorkOS env is misconfigured, skip AuthKit middleware so the site still renders
// and surface a clear warning instead of a 500 "MIDDLEWARE_INVOCATION_FAILED".
const middleware = isWorkOSConfigured
  ? authkitMiddleware({ debug: process.env.NODE_ENV === "development" })
  : () => {
      // Log a noisy warning once per cold start so we notice missing secrets without
      // breaking the marketing site.
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[workos] Auth middleware skipped. Missing env:",
          missingWorkOSEnv,
          "validCookiePassword:",
          hasValidCookiePassword,
        );
      }
      return NextResponse.next();
    };

export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (specific files)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
