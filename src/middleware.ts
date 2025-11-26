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

const isWorkOSConfigured = missingWorkOSEnv.length === 0 && hasValidCookiePassword;

// If WorkOS env is misconfigured, skip AuthKit middleware so the site still renders
// and surface a clear warning instead of a 500 "MIDDLEWARE_INVOCATION_FAILED".
const middleware = isWorkOSConfigured
  ? authkitMiddleware()
  : () => {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[workos] skipping auth middleware. Missing env:",
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
