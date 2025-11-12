# CORS Fix Summary

## Problem
The application at `zapdev.link` was experiencing CORS errors when trying to make API requests to the authentication endpoints:

```
Access to fetch at 'https://zapdev-mu.vercel.app/api/auth/get-session' 
from origin 'https://www.zapdev.link' has been blocked by CORS policy
```

**Root Cause**: The server-side auth configuration had a hardcoded URL pointing to `zapdev-mu.vercel.app` instead of using the actual deployment domain.

## Solution Implemented

### 1. Fixed Server-Side Auth Configuration
**File**: `src/lib/auth.ts`

**Before**:
```typescript
const getBaseURL = (): string => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "https://zapdev-mu.vercel.app"; // ❌ Hardcoded
};
```

**After**:
```typescript
const getBaseURL = (): string => {
  // Use environment variable first (production/staging)
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  // Development fallback
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  // Last resort: use NEXT_PUBLIC_APP_URL
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};
```

### 2. Added CORS Headers to Auth API Routes
**File**: `src/app/api/auth/[...all]/route.ts`

Added:
- `getAllowedOrigin()` function to validate and allow requests from the app's domain
- `addCorsHeaders()` function to add proper CORS headers to all responses
- `OPTIONS` handler for CORS preflight requests
- CORS header support for both `GET` and `POST` handlers

Features:
- ✅ Supports both `www.zapdev.link` and `zapdev.link`
- ✅ Allows credentials (cookies) to be sent with requests
- ✅ Handles preflight OPTIONS requests
- ✅ Validates origin against environment variables
- ✅ Development-friendly (allows localhost in dev mode)

### 3. Updated Next.js Global Headers
**File**: `next.config.mjs`

Added CORS headers specifically for auth API routes:
```javascript
{
  source: '/api/auth/:path*',
  headers: [
    {
      key: 'Access-Control-Allow-Credentials',
      value: 'true'
    },
    {
      key: 'Access-Control-Allow-Methods',
      value: 'GET, POST, PUT, DELETE, OPTIONS'
    },
    {
      key: 'Access-Control-Allow-Headers',
      value: 'Content-Type, Authorization, Cookie'
    },
  ]
}
```

### 4. Updated Documentation
**Files Updated**:
- `env.example` - Added important note about `BETTER_AUTH_URL`
- `explanations/DOMAIN_CONFIGURATION_GUIDE.md` - Complete setup guide (NEW)
- `explanations/CORS_FIX_SUMMARY.md` - This file (NEW)

## What You Need to Do

### Step 1: Set Environment Variables in Vercel

Go to your Vercel project settings and add/update:

```bash
BETTER_AUTH_URL=https://zapdev.link
NEXT_PUBLIC_APP_URL=https://zapdev.link
```

**Important**: 
- Use your actual domain (not `zapdev-mu.vercel.app`)
- Include `https://` protocol
- No trailing slashes
- Both variables should match

### Step 2: Redeploy

After setting the environment variables, trigger a new deployment:

```bash
git add .
git commit -m "Fix CORS issues with dynamic domain configuration"
git push
```

Or trigger a redeploy in Vercel dashboard.

### Step 3: Update OAuth Providers (if using)

If you're using Google or GitHub OAuth, update their redirect URIs:

**Google OAuth**:
- Authorized redirect URIs: `https://zapdev.link/api/auth/callback/google`
- Authorized JavaScript origins: `https://zapdev.link`

**GitHub OAuth**:
- Authorization callback URL: `https://zapdev.link/api/auth/callback/github`
- Homepage URL: `https://zapdev.link`

### Step 4: Update Polar.sh Webhook (if using)

Update your Polar.sh webhook URL to:
```
https://zapdev.link/api/polar/webhooks
```

### Step 5: Test

1. Clear browser cache and cookies
2. Visit `https://zapdev.link`
3. Try signing in
4. Check browser console - no CORS errors should appear
5. All API requests should go to `zapdev.link`, not `zapdev-mu.vercel.app`

## How It Works

### Development (localhost)
```
Client (localhost:3000) → Auth API (localhost:3000)
✅ Same origin, no CORS needed
```

### Production (before fix)
```
Client (zapdev.link) → Auth API (zapdev-mu.vercel.app)
❌ Different origins, CORS error
```

### Production (after fix)
```
Client (zapdev.link) → Auth API (zapdev.link)
✅ Same origin, CORS headers present
```

## Technical Details

### CORS Headers Added
- `Access-Control-Allow-Origin`: Dynamically set to match request origin
- `Access-Control-Allow-Credentials`: `true` (allows cookies)
- `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type, Authorization, Cookie`
- `Access-Control-Max-Age`: `86400` (24 hours cache for preflight)

### Security Features
- Origin validation against environment variables
- Support for both www and non-www subdomains
- Development mode allows localhost
- Credentials (cookies) only allowed for validated origins

## Troubleshooting

If you still see CORS errors after deploying:

1. **Check environment variables are set in Vercel**
   - Go to Settings → Environment Variables
   - Verify `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are set correctly

2. **Hard refresh your browser**
   - Chrome/Firefox: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or try incognito/private mode

3. **Verify deployment used new environment variables**
   - Redeploy if environment variables were added after last deployment
   - Check deployment logs for any errors

4. **Check for www vs non-www mismatch**
   - Ensure you're accessing the same domain set in environment variables
   - Consider setting up a redirect from one to the other in Vercel

5. **Clear all cookies for your domain**
   - Old session cookies might cause issues
   - Sign out completely and sign in again

## Files Changed

- ✅ `src/lib/auth.ts` - Dynamic base URL configuration
- ✅ `src/app/api/auth/[...all]/route.ts` - CORS headers and OPTIONS handler
- ✅ `next.config.mjs` - Global CORS headers for auth routes
- ✅ `env.example` - Updated documentation
- ✅ `explanations/DOMAIN_CONFIGURATION_GUIDE.md` - Complete setup guide
- ✅ `explanations/CORS_FIX_SUMMARY.md` - This summary

## Next Steps

1. Deploy the changes to production
2. Set the required environment variables
3. Test authentication flows
4. Update OAuth provider settings
5. Monitor for any remaining CORS issues

For detailed setup instructions, see: `explanations/DOMAIN_CONFIGURATION_GUIDE.md`
