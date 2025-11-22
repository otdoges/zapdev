# WorkOS Authentication Fix - November 22, 2025

## Summary

Fixed the "Unauthorized" error when creating projects by completing the WorkOS AuthKit integration with Convex backend.

## Issues Fixed

### ✅ Issue 1: ZodError "Please enter a message"
**Status**: Not a bug - working as designed

This is client-side form validation that prevents empty message submissions. The error appears in console during development but doesn't break functionality.

```typescript
// src/modules/home/ui/components/project-form.tsx:29-33
const formSchema = z.object({
  value: z.string()
    .trim()
    .min(1, { message: "Please enter a message" })
    .max(10000, { message: "Message is too long" }),
})
```

### ✅ Issue 2: Unauthorized Error (CRITICAL - FIXED)
**Status**: Fixed in commit `3b94454`

**Root Cause**: Mismatch between WorkOS JWT configuration and Convex auth setup.

**Changes Made**:

1. **Fixed Convex Auth Configuration** (`convex/auth.config.ts`)
   - Changed issuer from `https://api.workos.com/sso` → `https://api.workos.com`
   - Added `audience: process.env.WORKOS_CLIENT_ID`

2. **Fixed ConvexProvider** (`src/components/convex-provider.tsx`)
   - Changed from using stale `accessToken` to `getAccessToken()` for fresh JWT tokens
   - Added comment explaining the need for fresh tokens

3. **Added .env.example**
   - Documented all required WorkOS environment variables
   - Removed deprecated Stack Auth variables

4. **Updated CLAUDE.md**
   - Replaced all Stack Auth references with WorkOS AuthKit
   - Updated environment variable documentation

## Required Environment Variables

You need to add these to your local `.env.local` file:

```bash
# WorkOS Authentication
WORKOS_API_KEY="sk_..."              # From WorkOS Dashboard → API Keys
WORKOS_CLIENT_ID="client_..."        # From WorkOS Dashboard → Configuration
WORKOS_COOKIE_PASSWORD="..."         # Generate: openssl rand -base64 32
WORKOS_REDIRECT_URI="http://localhost:3000/auth/callback"  # Local dev
WORKOS_ISSUER_URL="https://api.workos.com"  # Default issuer URL
```

### How to Get WorkOS Credentials

1. **Go to WorkOS Dashboard**: https://dashboard.workos.com/
2. **Get API Key**: 
   - Navigate to **API Keys** section
   - Copy your **Secret Key** (starts with `sk_`)
3. **Get Client ID**: 
   - Navigate to **Configuration** or **SSO** section
   - Copy your **Client ID** (starts with `client_`)
4. **Generate Cookie Password**:
   ```bash
   openssl rand -base64 32
   ```
5. **Set Redirect URI**:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

## Next Steps

### 1. Add Environment Variables Locally

Create or update `.env.local`:

```bash
# Copy .env.example to .env.local if it doesn't exist
cp .env.example .env.local

# Edit .env.local and add your WorkOS credentials
# (See above for how to get these values)
```

### 2. Deploy Environment Variables to Convex

Run these commands to sync environment variables to Convex:

```bash
# Set WorkOS variables in Convex
npx convex env set WORKOS_CLIENT_ID "client_..."
npx convex env set WORKOS_API_KEY "sk_..."
npx convex env set WORKOS_COOKIE_PASSWORD "your-generated-password"
npx convex env set WORKOS_ISSUER_URL "https://api.workos.com"

# Verify they were set
npx convex env list
```

### 3. Test Authentication Flow

1. **Start development servers**:
   ```bash
   # Terminal 1
   bun run dev
   
   # Terminal 2
   bun run convex:dev
   ```

2. **Test the flow**:
   - ✅ Navigate to http://localhost:3000
   - ✅ Sign in with WorkOS
   - ✅ Create a new project (enter a message)
   - ✅ Verify no "Unauthorized" error appears
   - ✅ Check Convex dashboard for created project

### 4. Production Deployment

If deploying to Vercel:

1. **Add environment variables in Vercel Dashboard**:
   - Go to your project → Settings → Environment Variables
   - Add all WORKOS_* variables
   - Set `WORKOS_REDIRECT_URI` to your production callback URL

2. **Redeploy**:
   ```bash
   git push origin master
   # Or trigger manual deployment in Vercel
   ```

## Verification Checklist

After completing setup, verify:

- [ ] No "Unauthorized" error when creating projects
- [ ] `ctx.auth.getUserIdentity()` returns user data in Convex
- [ ] WorkOS authentication persists across page refreshes
- [ ] Form validation shows "Please enter a message" for empty input (expected behavior)
- [ ] Can create projects and see them in dashboard
- [ ] Messages and fragments are saved to Convex correctly

## Technical Details

### Authentication Flow

```
User Request (Frontend)
  ↓
WorkOS AuthKit Middleware (src/middleware.ts)
  ↓
JWT Token Generated
  ↓
ConvexProvider fetches fresh token (src/components/convex-provider.tsx)
  ↓
Token sent to Convex backend
  ↓
Convex validates JWT (convex/auth.config.ts)
  ↓
ctx.auth.getUserIdentity() returns user data
  ↓
Mutations/Queries execute with authenticated context
```

### Key Changes in Code

**Before (BROKEN)**:
```typescript
// convex/auth.config.ts
issuer: "https://api.workos.com/sso",  // ❌ Wrong issuer
// No audience field                   // ❌ Missing audience

// src/components/convex-provider.tsx
const { accessToken } = useAccessToken();  // ❌ Stale token
fetchAccessToken: async () => accessToken || null,
```

**After (FIXED)**:
```typescript
// convex/auth.config.ts
issuer: "https://api.workos.com",  // ✅ Correct issuer
audience: process.env.WORKOS_CLIENT_ID,  // ✅ Added audience

// src/components/convex-provider.tsx
const { getAccessToken } = useAccessToken();  // ✅ Fresh token getter
fetchAccessToken: async () => (await getAccessToken()) ?? null,
```

## Troubleshooting

### Still Getting "Unauthorized" Error?

1. **Check environment variables are set**:
   ```bash
   # In .env.local
   echo $WORKOS_CLIENT_ID
   echo $WORKOS_API_KEY
   
   # In Convex
   npx convex env list | grep WORKOS
   ```

2. **Verify WorkOS issuer URL**:
   - Should be `https://api.workos.com` (NOT `/sso` suffix)

3. **Check JWT token in browser**:
   - Open DevTools → Network tab
   - Look for Convex requests
   - Check Authorization header has JWT token

4. **Restart both dev servers**:
   ```bash
   # Kill both terminals and restart
   bun run dev
   bun run convex:dev
   ```

### Form Validation Errors in Console

These are **expected** and not bugs:
- `ZodError: "Please enter a message"` - appears when submitting empty form
- React strict mode warnings - development only
- Hot reload warnings - development only

## Related Files

- `convex/auth.config.ts` - JWT validation configuration
- `src/components/convex-provider.tsx` - Token fetching logic
- `src/middleware.ts` - WorkOS AuthKit middleware
- `convex/helpers.ts` - Authentication helper functions
- `convex/projects.ts` - Uses `ctx.auth.getUserIdentity()`
- `.env.example` - Environment variable documentation

## Commit Reference

**Commit**: `3b94454cb04343078eb2842939921618d0a3eee8`
**Branch**: `master`
**Files Changed**: 4
**Lines Changed**: +64 -11

## Support

If you continue experiencing issues:

1. Check WorkOS Dashboard for API logs
2. Check Convex Dashboard for function execution logs
3. Verify JWT token structure matches WorkOS documentation
4. Ensure redirect URI matches exactly in WorkOS configuration

---

**Status**: ✅ Fixed and committed
**Date**: November 22, 2025
**Migration**: Stack Auth → WorkOS AuthKit (Complete)
