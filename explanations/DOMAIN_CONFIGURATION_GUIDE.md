# Domain Configuration Guide

This guide will help you properly configure ZapDev to work with your custom domain and fix CORS issues.

## The Problem

CORS errors occur when the application's frontend and backend use different domains. For example:
- Frontend served from: `https://zapdev.link`
- Backend API calls going to: `https://zapdev-mu.vercel.app`

This causes browser security to block the requests with CORS policy errors.

## The Solution

### 1. Configure Environment Variables

Set these environment variables in your production deployment (Vercel, etc.):

```bash
# Your actual domain (must match what users see in their browser)
BETTER_AUTH_URL=https://zapdev.link
NEXT_PUBLIC_APP_URL=https://zapdev.link
```

**Important Notes:**
- Use `https://` for production (not `http://`)
- Don't include trailing slashes
- Both variables should have the same value
- If using `www.zapdev.link`, set it to that instead

### 2. Vercel Configuration Steps

If deploying to Vercel:

1. Go to your project settings: https://vercel.com/[your-username]/[project-name]/settings/environment-variables

2. Add/Update these variables:
   - `BETTER_AUTH_URL` → `https://zapdev.link`
   - `NEXT_PUBLIC_APP_URL` → `https://zapdev.link`

3. **Important**: Redeploy after changing environment variables
   ```bash
   # Trigger a new deployment
   git commit --allow-empty -m "Trigger redeploy for env vars"
   git push
   ```

### 3. Domain Setup

#### Option A: Use Root Domain Only (Recommended)
- Primary domain: `zapdev.link`
- Redirect `www.zapdev.link` → `zapdev.link`

In Vercel:
1. Go to Settings → Domains
2. Add `zapdev.link` as primary
3. Add `www.zapdev.link` and set it to redirect to `zapdev.link`

Set environment variables:
```bash
BETTER_AUTH_URL=https://zapdev.link
NEXT_PUBLIC_APP_URL=https://zapdev.link
```

#### Option B: Use WWW Subdomain
- Primary domain: `www.zapdev.link`
- Redirect `zapdev.link` → `www.zapdev.link`

Set environment variables:
```bash
BETTER_AUTH_URL=https://www.zapdev.link
NEXT_PUBLIC_APP_URL=https://www.zapdev.link
```

### 4. OAuth Provider Updates

After changing your domain, update OAuth redirect URIs:

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Update Authorized redirect URIs:
   ```
   https://zapdev.link/api/auth/callback/google
   ```
5. Update Authorized JavaScript origins:
   ```
   https://zapdev.link
   ```

#### GitHub OAuth
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Edit your OAuth App
3. Update Authorization callback URL:
   ```
   https://zapdev.link/api/auth/callback/github
   ```
4. Update Homepage URL:
   ```
   https://zapdev.link
   ```

### 5. Polar.sh Webhook URL

Update your Polar.sh webhook endpoint:

1. Go to [Polar.sh Dashboard](https://polar.sh/)
2. Navigate to Settings → Webhooks
3. Update webhook URL to:
   ```
   https://zapdev.link/api/polar/webhooks
   ```

## Testing the Fix

### 1. Check Environment Variables
After deployment, verify variables are set correctly:

```bash
# In your browser console on https://zapdev.link
console.log(window.location.origin);  // Should show https://zapdev.link
```

### 2. Test Authentication
1. Clear browser cookies and cache
2. Go to your domain: `https://zapdev.link`
3. Try signing in with email/password
4. Check browser console for any CORS errors
5. Try OAuth sign-in (Google/GitHub)

### 3. Verify API Requests
In browser DevTools Network tab:
- All API requests should go to `https://zapdev.link/api/*`
- No requests should go to `zapdev-mu.vercel.app`
- Response headers should include `Access-Control-Allow-Origin: https://zapdev.link`

## Common Issues

### Issue: Still seeing old domain in requests

**Solution**: 
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache completely
- Try incognito/private window
- Verify environment variables in Vercel dashboard

### Issue: OAuth redirects to wrong domain

**Solution**:
- Double-check OAuth provider settings match your domain exactly
- Ensure no typos in redirect URIs
- Wait a few minutes for OAuth provider changes to propagate

### Issue: CORS errors persist

**Solution**:
1. Verify both `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are identical
2. Check they match your actual domain (no www mismatch)
3. Ensure you redeployed after setting environment variables
4. Clear browser cache and cookies

### Issue: Session cookies not working

**Solution**:
- Check that your domain supports secure cookies (HTTPS)
- Verify `BETTER_AUTH_SECRET` is set in production
- Clear all cookies for your domain
- Try signing in again

## Development vs Production

### Development (localhost:3000)
```bash
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (zapdev.link)
```bash
BETTER_AUTH_URL=https://zapdev.link
NEXT_PUBLIC_APP_URL=https://zapdev.link
```

## Verification Checklist

Before going live, verify:

- [ ] `BETTER_AUTH_URL` environment variable set in production
- [ ] `NEXT_PUBLIC_APP_URL` environment variable set in production
- [ ] Both variables use the same domain
- [ ] Domain uses HTTPS (not HTTP)
- [ ] No trailing slashes in URLs
- [ ] Vercel domain settings configured correctly
- [ ] OAuth providers updated with new redirect URIs
- [ ] Polar.sh webhook URL updated
- [ ] Tested sign-in flow (email + OAuth)
- [ ] No CORS errors in browser console
- [ ] All API requests go to correct domain

## Need Help?

If you're still experiencing issues:

1. Check browser console for specific error messages
2. Review Vercel deployment logs
3. Verify all environment variables are set correctly
4. Test in incognito mode to rule out caching issues

## Technical Details

The CORS fix implemented includes:

1. **Dynamic base URL** (`src/lib/auth.ts`): Uses environment variables instead of hardcoded domain
2. **CORS headers** (`src/app/api/auth/[...all]/route.ts`): Adds proper CORS headers to all auth endpoints
3. **Preflight support**: Handles OPTIONS requests for CORS preflight checks
4. **WWW subdomain support**: Automatically allows both www and non-www variants
5. **Next.js headers** (`next.config.mjs`): Global CORS headers for API routes
