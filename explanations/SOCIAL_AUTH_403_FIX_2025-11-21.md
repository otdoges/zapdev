# Social Authentication 403 Error Fix - November 21, 2025

## Problem
Social sign-in (GitHub/Google OAuth) was failing with **403 Forbidden** error:

```
POST https://www.zapdev.link/api/auth/sign-in/social → 403 (Forbidden)
```

Meanwhile, Vercel Dashboard showed **200 OK** for the same endpoint, indicating the server processed the request successfully but Better Auth rejected it with a CSRF/origin validation error.

## Root Cause

**Origin Mismatch in `trustedOrigins` Configuration**

The issue was in `/src/lib/auth.ts` (lines 360-362):

```typescript
trustedOrigins: process.env.NODE_ENV === "production"
    ? [getAppUrl()]  // Only included www.zapdev.link
    : [getAppUrl(), "http://localhost:3000"],
```

### What Went Wrong

1. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL="https://www.zapdev.link"` (has `www` prefix)
   - Users access the site at **both**:
     - `https://www.zapdev.link` (canonical, with www)
     - `https://zapdev.link` (redirect target, without www)

2. **Better Auth CSRF Protection**:
   - Better Auth validates the `Origin` header of incoming requests
   - Checks if origin is in `trustedOrigins` array
   - If **not found** → rejects with **403 Forbidden**

3. **The Mismatch**:
   - User visits `https://zapdev.link` (no www)
   - Clicks "Sign in with GitHub"
   - Browser sends request with `Origin: https://zapdev.link`
   - Better Auth checks `trustedOrigins`: `["https://www.zapdev.link"]`
   - **Origin not found** → 403 Forbidden

### Why Vercel Showed 200 OK

Vercel's edge network and Next.js successfully handled the HTTP request (200 OK status), but **Better Auth middleware** rejected it during authentication validation, returning a 403 response body.

## The Fix

Updated `/src/lib/auth.ts` to include **both** www and non-www origins:

```typescript
// Security headers for cookies
// Include both www and non-www versions to handle redirects
trustedOrigins: process.env.NODE_ENV === "production"
    ? [
        getAppUrl(),                 // www.zapdev.link
        "https://zapdev.link",       // non-www version
        "https://www.zapdev.link",   // explicit www version
    ]
    : [getAppUrl(), "http://localhost:3000"],
```

### Why This Works

1. **Covers All Origins**:
   - Users coming from `zapdev.link` (via DNS or direct access)
   - Users coming from `www.zapdev.link` (canonical)
   - Handles edge cases where `getAppUrl()` might return different values

2. **Maintains Security**:
   - Still validates origin (prevents CSRF attacks)
   - Only allows specific domains (not wildcards)
   - Better Auth still enforces SameSite cookies and CSRF tokens

3. **Handles Vercel Redirects**:
   - Vercel redirects `www → non-www` or vice versa based on DNS config
   - Both origins are now trusted during OAuth flows

## How Better Auth CSRF Protection Works

Better Auth implements multi-layered CSRF protection:

1. **SameSite Cookies** (`Lax` or `Strict`):
   - Prevents cookies from being sent with cross-site requests
   - Automatically enabled by `nextCookies()` plugin

2. **Origin Validation**:
   - Checks `Origin` header matches `trustedOrigins`
   - Rejects requests from unauthorized domains
   - **This is where the 403 was happening**

3. **CSRF Tokens**:
   - State parameter in OAuth flows
   - Double-submit cookie pattern for form submissions

4. **Secure Cookie Attributes**:
   - `HttpOnly` - prevents JavaScript access
   - `Secure` - HTTPS only in production
   - `SameSite=Lax` - restricts cross-site usage

## Testing After Fix

### Manual Testing

1. **Visit Non-WWW Version**:
   ```
   https://zapdev.link
   ```
   - Click "Continue with GitHub"
   - Should redirect to GitHub OAuth
   - Complete authorization
   - Should redirect back to dashboard
   - ✅ Session created successfully

2. **Visit WWW Version**:
   ```
   https://www.zapdev.link
   ```
   - Click "Continue with Google"
   - Should redirect to Google OAuth
   - Complete authorization
   - Should redirect back to dashboard
   - ✅ Session created successfully

3. **Check Browser Console**:
   - No 403 errors
   - No CORS errors
   - No "trustedOrigins" warnings

### Automated Testing

```typescript
// Test both origins are trusted
import { auth } from "@/lib/auth";

const config = auth.options;
console.log(config.trustedOrigins);
// Expected output in production:
// [
//   "https://www.zapdev.link",
//   "https://zapdev.link",
//   "https://www.zapdev.link"
// ]
```

## Why This Happened

The Better Auth migration from Clerk/Stack Auth was completed locally, but edge cases around domain variations weren't tested:

1. **Local Development**:
   - Used `localhost:3000` (single origin)
   - No www/non-www variations
   - Everything worked ✅

2. **Production Deployment**:
   - DNS configured with both www and non-www records
   - Users can access via either domain
   - Only www version was in `trustedOrigins`
   - Non-www users got 403 ❌

3. **Vercel Configuration**:
   - `vercel.json` has redirect rules for www handling
   - But Better Auth validates origin **before** redirects execute
   - Need to trust both origins

## Related Files Modified

1. ✅ `/src/lib/auth.ts` - Added both origins to `trustedOrigins`
2. 📄 `/explanations/SOCIAL_AUTH_403_FIX_2025-11-21.md` - This documentation

## Deployment Instructions

### 1. Commit Changes

```bash
git add src/lib/auth.ts explanations/SOCIAL_AUTH_403_FIX_2025-11-21.md
git commit -m "fix: add both www and non-www origins to trustedOrigins for Better Auth"
git push origin master
```

### 2. Verify Deployment

After Vercel auto-deploys:

1. Visit: https://zapdev.link
   - Test GitHub OAuth
   - Test Google OAuth

2. Visit: https://www.zapdev.link
   - Test GitHub OAuth
   - Test Google OAuth

3. Check Vercel Function Logs:
   - No 403 errors for `/api/auth/sign-in/social`
   - Successful session creation logs

### 3. Monitor for Errors

Check Sentry dashboard for:
- No new 403 auth errors
- No CSRF validation failures
- No origin mismatch errors

## Additional Fixes (Optional)

### Normalize Environment Variables

Consider updating `.env.vercel` to use non-www as canonical:

```bash
# Before
NEXT_PUBLIC_APP_URL="https://www.zapdev.link"
NEXT_PUBLIC_BETTER_AUTH_URL="https://zapdev.link"

# After (consistent)
NEXT_PUBLIC_APP_URL="https://zapdev.link"
NEXT_PUBLIC_BETTER_AUTH_URL="https://zapdev.link"
```

This would make the configuration clearer, but the current fix handles both cases.

### Add Origin Debug Logging

For future debugging, add logging in development:

```typescript
// In src/lib/auth.ts (development only)
if (process.env.NODE_ENV === "development") {
  console.log("Better Auth Trusted Origins:", 
    process.env.NODE_ENV === "production"
      ? [getAppUrl(), "https://zapdev.link", "https://www.zapdev.link"]
      : [getAppUrl(), "http://localhost:3000"]
  );
}
```

## Prevention

To avoid similar issues in the future:

1. **Test All Domain Variations**:
   - www vs non-www
   - Custom domains
   - Preview deployments

2. **Document Trusted Origins**:
   - List all valid origins in `.env.example`
   - Update when adding new domains

3. **Add E2E Tests**:
   - Test OAuth flows from different origins
   - Verify CSRF protection works correctly

4. **Monitor 403 Errors**:
   - Set up Sentry alerts for auth-related 403s
   - Check Vercel Function Logs regularly

## Summary

**Problem**: Social OAuth returned 403 due to origin mismatch
**Cause**: `trustedOrigins` only included www version
**Fix**: Added both www and non-www origins to trusted list
**Impact**: Users can now sign in from both domain variations
**Security**: CSRF protection still enforced, just allows both origins

## Verification Checklist

After deployment, verify:

- [ ] Can sign in with GitHub from `zapdev.link`
- [ ] Can sign in with GitHub from `www.zapdev.link`
- [ ] Can sign in with Google from `zapdev.link`
- [ ] Can sign in with Google from `www.zapdev.link`
- [ ] No 403 errors in browser console
- [ ] No 403 errors in Vercel Function Logs
- [ ] Session persists after OAuth redirect
- [ ] User data synced to Convex database

## Support

If issues persist after this fix:

1. **Check Environment Variables**:
   ```bash
   # In Vercel Dashboard → Settings → Environment Variables
   NEXT_PUBLIC_APP_URL=https://www.zapdev.link
   NEXT_PUBLIC_BETTER_AUTH_URL=https://zapdev.link
   SITE_URL=https://zapdev.link
   ```

2. **Verify DNS Configuration**:
   - Ensure both www and non-www resolve
   - Check Vercel domain settings

3. **Clear Browser Cache**:
   - Clear cookies for zapdev.link
   - Try in incognito mode

4. **Check OAuth App Settings**:
   - GitHub OAuth App: Authorized callback URL includes both domains
   - Google OAuth App: Authorized redirect URIs includes both domains

## Notes

- This fix is **backward compatible** (doesn't break existing sessions)
- No database migration required
- No environment variable changes needed (though cleanup recommended)
- Works with Vercel's redirect configuration
- Maintains all Better Auth security features
