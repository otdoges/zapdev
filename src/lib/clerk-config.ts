/**
 * Centralizes Clerk-related environment handling with sensible fallbacks.
 * - Accepts either publishableKey or frontendApi (host only, no protocol).
 * - Normalizes optional proxy/sign-in URLs and trims stray slashes/protocols.
 */
export function getClerkInstanceConfig() {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    undefined;

  const frontendApi = normalizeHost(
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ||
      process.env.CLERK_FRONTEND_API_URL ||
      process.env.NEXT_CLERK_FRONTEND_API_URL ||
      process.env.CLERK_JWT_ISSUER_DOMAIN,
  );

  if (!publishableKey && !frontendApi) {
    throw new Error(
      "Missing Clerk configuration. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CLERK_FRONTEND_API",
    );
  }

  return {
    publishableKey,
    frontendApi,
    proxyUrl: normalizeUrl(process.env.NEXT_PUBLIC_CLERK_PROXY_URL),
    signInUrl:
      normalizePath(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL) || "/sign-in",
    signUpUrl:
      normalizePath(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL) || "/sign-up",
    signInFallbackRedirectUrl:
      normalizePath(
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
      ) || "/",
    signUpFallbackRedirectUrl:
      normalizePath(
        process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
      ) || "/",
    appUrl: normalizeUrl(process.env.NEXT_PUBLIC_APP_URL),
  };
}

function normalizeHost(value?: string | null) {
  if (!value) return undefined;
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function normalizeUrl(value?: string | null) {
  if (!value) return undefined;
  return value.replace(/\/$/, "");
}

function normalizePath(value?: string | null) {
  if (!value) return undefined;
  return value.startsWith("/") ? value : `/${value}`;
}
