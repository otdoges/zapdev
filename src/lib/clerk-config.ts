/**
 * Centralizes Clerk-related environment handling with sensible fallbacks.
 * - Accepts either publishableKey or frontendApi (host only, no protocol).
 * - Normalizes optional proxy/sign-in URLs and trims stray slashes/protocols.
 * - Validates proxy URLs to prevent CORS/404 errors from invalid domains.
 */
export function getClerkInstanceConfig() {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    undefined;

  const rawFrontendApi =
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ||
    process.env.CLERK_FRONTEND_API_URL ||
    process.env.NEXT_CLERK_FRONTEND_API_URL ||
    process.env.CLERK_JWT_ISSUER_DOMAIN;
  
  const frontendApi = validateClerkDomain(rawFrontendApi);

  if (!publishableKey && !frontendApi) {
    throw new Error(
      "Missing Clerk configuration. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CLERK_FRONTEND_API",
    );
  }

  return {
    publishableKey,
    frontendApi,
    proxyUrl: validateProxyUrl(process.env.NEXT_PUBLIC_CLERK_PROXY_URL),
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

const VALID_CLERK_DOMAINS = [
  ".clerk.accounts.dev",
  ".clerk.dev",
  ".clerkstage.dev",
  ".lclclerk.com",
  "clerk.zapdev.link",
];

function isValidClerkDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return VALID_CLERK_DOMAINS.some(domain => 
    domain.startsWith(".") ? lower.endsWith(domain) : lower === domain
  );
}

function validateClerkDomain(value?: string | null): string | undefined {
  if (!value) return undefined;

  const normalized = normalizeHost(value);
  if (!normalized) return undefined;

  if (isValidClerkDomain(normalized)) {
    return normalized;
  }

  console.warn(
    `[Clerk Config] Invalid Clerk domain "${normalized}" - must be a valid Clerk domain (e.g., *.clerk.accounts.dev). Ignoring to prevent CORS/404 errors.`
  );
  return undefined;
}

function validateProxyUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  
  const normalized = normalizeUrl(value);
  if (!normalized) return undefined;
  
  try {
    const url = new URL(normalized);
    
    if (!isValidClerkDomain(url.hostname)) {
      console.warn(
        `[Clerk Config] Invalid proxy URL "${normalized}" - must be a Clerk domain. Ignoring to prevent CORS/404 errors.`
      );
      return undefined;
    }
    
    return normalized;
  } catch {
    console.warn(
      `[Clerk Config] Invalid proxy URL format "${value}". Ignoring.`
    );
    return undefined;
  }
}
