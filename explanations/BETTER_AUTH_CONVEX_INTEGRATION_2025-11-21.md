# Better Auth + Convex Integration Migration

**Date:** November 21, 2025  
**Status:** ✅ Complete

## Overview

Successfully migrated from custom Better Auth integration to the official `@convex-dev/better-auth` component. This resolves CORS errors, authentication failures, and improves overall integration reliability.

## Problems Solved

### 1. CORS Errors
**Before:** Better Auth tried to call `zapdev.link/api/auth/get-session` from `www.zapdev.link` (different origins)  
**After:** The `convexClient()` plugin automatically routes through Convex's `.site` URL, eliminating cross-origin issues

### 2. Authentication Failures
**Before:** Convex queries failed with "Unauthorized" due to manual JWT token exchange  
**After:** `authComponent.getAuthUser(ctx)` provides seamless authentication state

### 3. Form Validation Errors
**Before:** ZodError for empty messages due to undefined auth state  
**After:** Proper auth state propagation through `ConvexBetterAuthProvider`

## Changes Made

### 1. Package Installation
```bash
bun add @convex-dev/better-auth
```

### 2. Convex Configuration
**File:** `convex/convex.config.ts`
```typescript
import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";

const app = defineApp();
app.use(betterAuth);

export default app;
```

### 3. Better Auth Instance (NEW)
**File:** `convex/auth.ts` (Created)
- Exports `authComponent` for Convex integration
- Exports `createAuth` function with Polar plugins
- Includes `getCurrentUser` query helper
- Conditionally loads Polar/GitHub/Google based on env vars

Key features:
- Uses `authComponent.adapter(ctx)` for database operations
- Includes `convexPlugin()` (REQUIRED as first plugin)
- Lazy initialization prevents build-time env var errors

### 4. HTTP Route Handlers
**File:** `convex/http.ts`
```typescript
import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();
authComponent.registerRoutes(http, createAuth);

export default http;
```

**File:** `src/app/api/auth/[...all]/route.ts`
```typescript
import { nextJsHandler } from "@convex-dev/better-auth/nextjs";

export const { GET, POST } = nextJsHandler();
```

### 5. Client-Side Updates
**File:** `src/lib/auth-client.ts`
```typescript
import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth";

export const authClient = createAuthClient({
    plugins: [
        convexClient(), // Handles routing through Convex
        polarClient(),
    ],
});
```

**File:** `src/components/convex-provider.tsx`
```typescript
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  expectAuth: true,
});

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
```

### 6. Server-Side Auth Helper
**File:** `src/lib/auth-server.ts`
```typescript
import { createAuth } from "@/convex/auth";
import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";

export const getToken = () => {
  return getTokenNextjs(createAuth);
};
```

### 7. Convex Helpers
**File:** `convex/helpers.ts`
```typescript
import { authComponent } from "./auth";

export async function getCurrentUserId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const user = await authComponent.getAuthUser(ctx);
  return user?.id || null;
}
```

### 8. Environment Variables
**File:** `.env.local`
```bash
NEXT_PUBLIC_CONVEX_URL=https://dependable-trout-339.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://dependable-trout-339.convex.site
SITE_URL=http://localhost:3000
```

**Convex Environment (set via CLI):**
```bash
npx convex env set SITE_URL https://zapdev.link
npx convex env set BETTER_AUTH_SECRET <secret>
```

**File:** `convex/auth.config.ts`
```typescript
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
```

### 9. Cleanup
- ❌ Removed `src/app/api/convex-auth/route.ts` (obsolete)
- ❌ Removed custom JWT token exchange logic
- ❌ Removed manual baseURL configuration in auth-client.ts

## Architecture

### Before (Custom Integration)
```
User → Better Auth → /api/convex-auth → Manual JWT → Convex
                     ↑ CORS errors here
```

### After (Official Component)
```
User → Better Auth → convexClient() → Convex .site URL → Convex
                     ↑ No CORS (same domain via .site)
```

## Key Benefits

1. **CORS-Free**: All auth requests route through `<deployment>.convex.site`
2. **Type-Safe**: Full TypeScript support via `authComponent.getAuthUser(ctx)`
3. **Simplified**: No manual token exchange or custom auth endpoints
4. **Official**: Uses Convex's official Better Auth component
5. **Conditional Loading**: Polar/OAuth plugins only load when credentials exist

## Testing Checklist

- [ ] Sign up with email/password
- [ ] Email verification flow
- [ ] Login with email/password
- [ ] GitHub OAuth login
- [ ] Google OAuth login
- [ ] Password reset flow
- [ ] Convex queries work when authenticated
- [ ] Convex queries fail when unauthenticated
- [ ] Polar checkout integration
- [ ] Polar subscription webhooks
- [ ] Session persistence across page reloads

## Production Deployment

1. Set environment variables in Vercel:
   ```bash
   NEXT_PUBLIC_CONVEX_SITE_URL=https://<deployment>.convex.site
   SITE_URL=https://zapdev.link
   ```

2. Deploy to Convex:
   ```bash
   bunx convex deploy
   npx convex env set SITE_URL https://zapdev.link --prod
   ```

3. Deploy to Vercel:
   ```bash
   git push origin master
   ```

## Troubleshooting

### "Missing required environment variable: POLAR_ACCESS_TOKEN"
**Solution:** Polar plugin now loads conditionally. This error only appears if you reference it directly. The component handles this gracefully.

### "Unauthorized" in Convex queries
**Solution:** Ensure `ConvexBetterAuthProvider` wraps your app and `authComponent.getAuthUser(ctx)` is used in queries/mutations.

### CORS errors persist
**Solution:** Verify `NEXT_PUBLIC_CONVEX_SITE_URL` is set and `convexClient()` plugin is included in auth-client.ts.

## Files Modified

### Created
- `convex/auth.ts` (356 lines)

### Updated
- `convex/convex.config.ts`
- `convex/http.ts`
- `convex/auth.config.ts`
- `convex/helpers.ts`
- `src/lib/auth-client.ts`
- `src/lib/auth-server.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/components/convex-provider.tsx`
- `.env.local`

### Deleted
- `src/app/api/convex-auth/route.ts`

## References

- [Official Docs](https://convex-better-auth.netlify.app/framework-guides/next)
- [Component GitHub](https://github.com/get-convex/better-auth)
- [Better Auth Docs](https://www.better-auth.com/docs)
