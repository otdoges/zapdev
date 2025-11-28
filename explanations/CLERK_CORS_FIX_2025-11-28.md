# Clerk CORS/404 Error Fix - 2025-11-28

## Problem

The application was experiencing CORS and 404 errors when trying to load Clerk JavaScript files:

```
(index):1 Access to script at 'https://clerk.zapdev.link/npm/@clerk/clerk-js@5/dist/clerk.browser.js' 
from origin 'https://www.zapdev.link' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.

(index):1 GET https://clerk.zapdev.link/npm/@clerk/clerk-js@5/dist/clerk.browser.js 
net::ERR_FAILED 404 (Not Found)
```

## Root Cause

The `ClerkProvider` component was configured with a `proxyUrl` pointing to `https://clerk.zapdev.link`, which:
1. Does not exist as a valid Clerk proxy server
2. Has no CORS headers configured
3. Returns 404 errors for Clerk JavaScript assets

## Solution

Removed the invalid `proxyUrl` configuration from `ClerkProvider` in `src/components/convex-provider.tsx`.

### Changes Made

**File**: `src/components/convex-provider.tsx`

```diff
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={clerkConfig.publishableKey}
-
-      proxyUrl={clerkConfig.proxyUrl}
      signInUrl={clerkConfig.signInUrl}
      signUpUrl={clerkConfig.signUpUrl}
      signInFallbackRedirectUrl={clerkConfig.signInFallbackRedirectUrl}
      signUpFallbackRedirectUrl={clerkConfig.signUpFallbackRedirectUrl}
    >
```

### Environment Variables Checked

- ✅ `NEXT_PUBLIC_CLERK_PROXY_URL` not found in `.env.local`
- ✅ `NEXT_PUBLIC_CLERK_PROXY_URL` not found in `.env.vercel`

No environment variable cleanup was necessary.

## How This Fixes The Issue

Without the `proxyUrl` prop, Clerk will:
- Use its default CDN infrastructure for loading JavaScript files
- Load from the authenticated endpoint: `https://[your-clerk-subdomain].clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js`
- Handle CORS correctly through Clerk's official infrastructure
- Avoid 404 errors from non-existent proxy servers

## When To Use Clerk Proxy URL

The `proxyUrl` configuration should **only** be used when you have:
- A properly configured reverse proxy with DNS records
- SSL certificates configured for the proxy domain
- CORS headers correctly configured on the proxy
- A specific need for self-hosting or custom domain requirements

For most applications using Clerk's standard infrastructure, **do not set a proxy URL**.

## Verification Steps

To verify the fix works:

1. Clear browser cache and cookies
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Open browser DevTools → Network tab
4. Look for successful loads from `clerk.accounts.dev` domain
5. Verify no CORS or 404 errors in the Console tab

## Related Files

- `src/components/convex-provider.tsx` - Clerk provider configuration
- `src/lib/clerk-config.ts` - Clerk config helper (unchanged, still supports proxyUrl for future use)
- `convex/auth.config.ts` - Convex authentication config (uses different settings)

## References

- [Clerk Proxy Documentation](https://clerk.com/docs/deployments/proxy)
- [Clerk Next.js Setup](https://clerk.com/docs/quickstarts/nextjs)
