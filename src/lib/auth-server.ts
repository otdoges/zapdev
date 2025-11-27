import { ConvexHttpClient } from "convex/browser";
import { withAuth } from "@workos-inc/authkit-nextjs";

const WORKOS_ENV_KEYS = [
  "WORKOS_API_KEY",
  "WORKOS_CLIENT_ID",
  "WORKOS_COOKIE_PASSWORD",
] as const;

function getAuthkitStatus() {
  const missingEnv = WORKOS_ENV_KEYS.filter((key) => !process.env[key]);
  const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD || "";
  const hasValidCookiePassword = cookiePassword.length >= 32;

  return {
    enabled: missingEnv.length === 0 && hasValidCookiePassword,
    missingEnv,
    hasValidCookiePassword,
  };
}

async function getAuthContext() {
  const status = getAuthkitStatus();

  if (!status.enabled) {
    console.error(
      "[workos] AuthKit is not configured. Missing env:",
      status.missingEnv,
      "validCookiePassword:",
      status.hasValidCookiePassword,
    );
    return null;
  }

  try {
    // Ensure we don't throw if AuthKit is not fully initialized or if called outside of request context
    const context = await withAuth();
    return context;
  } catch (error) {
    // Check if this is the specific "withAuth on uncovered route" error
    if (error instanceof Error && error.message.includes("isn't covered by the AuthKit middleware")) {
      console.error(
        "[workos] CRITICAL: Route called withAuth() but middleware didn't run.",
        "Check middleware matcher config in middleware.ts",
        error,
      );
    } else {
      console.error(
        "[workos] AuthKit middleware error:",
        error,
      );
    }
    return null;
  }
}

/**
 * Get the authenticated user from WorkOS AuthKit
 */
export async function getUser() {
  const authContext = await getAuthContext();
  return authContext?.user ?? null;
}

/**
 * Get the authentication token for Convex
 */
export async function getToken() {
  const authContext = await getAuthContext();
  return authContext?.accessToken || null;
}

/**
 * Get auth headers for API calls
 */
export async function getAuthHeaders() {
  const token = await getToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Create a Convex HTTP client with WorkOS authentication
 * Use this in API routes that need to call Convex
 */
export async function getConvexClientWithAuth() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }

  const httpClient = new ConvexHttpClient(convexUrl);

  const accessToken = await getToken();

  if (!accessToken) {
    console.error(
      "[workos] Missing access token for Convex client. Middleware may be skipped or user is unauthenticated.",
    );
    return httpClient;
  }

  httpClient.setAuth(accessToken);
  return httpClient;
}
