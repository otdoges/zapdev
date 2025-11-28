# WorkOS Migration Guide

This guide helps you migrate from Clerk to WorkOS AuthKit authentication.

## Overview

We've migrated from Clerk to WorkOS AuthKit for authentication. WorkOS provides enterprise-ready authentication with better pricing (free up to 1M users) and seamless integration with Convex.

## What Changed

### 1. Authentication Provider
- **Before**: Clerk (`@clerk/nextjs`)
- **After**: WorkOS AuthKit (`@workos-inc/authkit-nextjs`)

### 2. Environment Variables

**Remove these Clerk variables:**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_JWT_ISSUER_DOMAIN
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
```

**Add these WorkOS variables:**
```bash
WORKOS_API_KEY=sk_test_xxx                           # From WorkOS Dashboard → API Keys
WORKOS_CLIENT_ID=client_xxx                          # From WorkOS Dashboard → Configuration
WORKOS_REDIRECT_URI=http://localhost:3000/callback   # Auth callback URL
WORKOS_WEBHOOK_SECRET=wh_secret_xxx                  # From WorkOS Dashboard → Webhooks
WORKOS_API_URL=https://api.workos.com                # WorkOS API endpoint
```

### 3. Files Changed

**Modified:**
- `src/middleware.ts` - Uses WorkOS middleware
- `src/components/convex-provider.tsx` - Integrates WorkOS with Convex
- `src/lib/auth-server.ts` - Uses WorkOS server functions
- `src/components/user-control.tsx` - Uses WorkOS user hooks
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Redirects to WorkOS
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Redirects to WorkOS
- `src/modules/home/ui/components/navbar.tsx` - Updated auth buttons
- `convex/auth.config.ts` - Points to WorkOS JWKS endpoint

**Created:**
- `src/app/callback/route.ts` - OAuth callback handler
- `src/app/sign-out/route.ts` - Sign out handler
- `src/app/api/webhooks/workos/route.ts` - WorkOS webhook handler

**Deleted:**
- `src/lib/clerk-config.ts` - Clerk configuration (no longer needed)
- `src/app/api/webhooks/clerk/route.ts` - Clerk webhook handler

## Setup Instructions

### Step 1: Create WorkOS Account

1. Go to [WorkOS Dashboard](https://dashboard.workos.com)
2. Sign up for a free account
3. Create a new environment (Development)

### Step 2: Configure AuthKit

1. In WorkOS Dashboard, go to **AuthKit** → **Configuration**
2. Set up your redirect URI:
   - Development: `http://localhost:3000/callback`
   - Production: `https://your-domain.com/callback`
3. Copy your **Client ID**

### Step 3: Get API Keys

1. Go to **API Keys** in WorkOS Dashboard
2. Copy your **API Key** (starts with `sk_`)
3. Store securely in your `.env.local` file

### Step 4: Set Up Webhooks

1. Go to **Webhooks** in WorkOS Dashboard
2. Create a new webhook endpoint:
   - Development: Use ngrok or similar tunneling service
   - Production: `https://your-domain.com/api/webhooks/workos`
3. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the **Webhook Secret**

### Step 5: Update Environment Variables

Create or update your `.env.local` file:

```bash
# WorkOS Authentication
WORKOS_API_KEY=sk_test_YOUR_API_KEY
WORKOS_CLIENT_ID=client_YOUR_CLIENT_ID
WORKOS_REDIRECT_URI=http://localhost:3000/callback
WORKOS_WEBHOOK_SECRET=wh_secret_YOUR_WEBHOOK_SECRET
WORKOS_API_URL=https://api.workos.com
```

### Step 6: Update Convex Deployment

If you're using Convex, update the environment variables:

```bash
npx convex env set WORKOS_API_URL https://api.workos.com
```

Or set it in your Convex Dashboard → Settings → Environment Variables.

### Step 7: Install Dependencies

```bash
bun install
```

This will install `@workos-inc/authkit-nextjs` and remove `@clerk/nextjs`.

### Step 8: Test Authentication Flow

1. Start your development server:
   ```bash
   bun run dev
   ```

2. Start Convex:
   ```bash
   bun run convex:dev
   ```

3. Navigate to `http://localhost:3000`

4. Click "Sign in" - you should be redirected to WorkOS AuthKit

5. Create a test account and verify:
   - You're redirected back to your app
   - User data appears in user control dropdown
   - You can access protected routes

## User Data Mapping

WorkOS user object differs from Clerk:

| Clerk | WorkOS |
|-------|--------|
| `user.fullName` | `[user.firstName, user.lastName].join(' ')` |
| `user.primaryEmailAddress.emailAddress` | `user.email` |
| `user.imageUrl` | `user.profilePictureUrl` |
| `user.id` | `user.id` |

## Migration Considerations

### User IDs
- Existing users have Clerk-formatted user IDs in your database
- WorkOS generates different user ID formats
- You may need to:
  1. Add a migration script to map old Clerk IDs to new WorkOS IDs
  2. Maintain a mapping table during transition period
  3. Ask existing users to re-authenticate

### Social Logins
- Reconfigure OAuth apps (Google, GitHub, etc.) in WorkOS Dashboard
- Update redirect URIs in each OAuth provider to point to WorkOS

### Custom Claims
- Clerk: Used `publicMetadata` for custom claims (e.g., `plan: "pro"`)
- WorkOS: Uses organization metadata for custom claims
- Current implementation: Plan is stored in Convex `subscriptions` table

### Session Management
- WorkOS sessions work differently from Clerk
- Session tokens are managed automatically by WorkOS SDK
- No need to manually refresh tokens

## Troubleshooting

### Issue: "Missing WORKOS_API_KEY"
**Solution**: Ensure all WorkOS environment variables are set in `.env.local`

### Issue: Redirect loop after sign-in
**Solution**: Verify `WORKOS_REDIRECT_URI` matches exactly what's configured in WorkOS Dashboard

### Issue: "Invalid session"
**Solution**: 
1. Clear browser cookies
2. Verify `WORKOS_API_URL` is set correctly
3. Check Convex `auth.config.ts` points to WorkOS

### Issue: Webhook not receiving events
**Solution**:
1. For local development, use ngrok: `ngrok http 3000`
2. Update webhook URL in WorkOS Dashboard
3. Verify `WORKOS_WEBHOOK_SECRET` matches

### Issue: User data not showing
**Solution**: 
1. Check browser console for errors
2. Verify `useUser()` hook returns data
3. Ensure session is valid

## Production Deployment

### Vercel Deployment

1. Add all WorkOS environment variables to Vercel:
   ```bash
   vercel env add WORKOS_API_KEY
   vercel env add WORKOS_CLIENT_ID
   vercel env add WORKOS_REDIRECT_URI
   vercel env add WORKOS_WEBHOOK_SECRET
   vercel env add WORKOS_API_URL
   ```

2. Update `WORKOS_REDIRECT_URI` to production URL:
   ```
   https://your-domain.com/callback
   ```

3. Update WorkOS webhook endpoint to production:
   ```
   https://your-domain.com/api/webhooks/workos
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

### Convex Production

Update Convex production environment:

```bash
npx convex deploy
npx convex env set WORKOS_API_URL https://api.workos.com --prod
```

## Benefits of WorkOS

1. **Cost**: Free up to 1M users (vs Clerk's pricing)
2. **Enterprise Ready**: Built-in support for SSO, SCIM, RBAC
3. **Convex Integration**: Official integration with Convex
4. **Developer Experience**: Simple API, excellent docs
5. **Flexibility**: Easy to customize authentication flows

## Support

- [WorkOS Documentation](https://workos.com/docs)
- [WorkOS Next.js Guide](https://workos.com/docs/authkit/nextjs)
- [Convex + WorkOS Integration](https://docs.convex.dev/auth/authkit)

## Migration Checklist

- [ ] Create WorkOS account
- [ ] Configure AuthKit in WorkOS Dashboard
- [ ] Get API keys and webhook secret
- [ ] Update `.env.local` with WorkOS variables
- [ ] Run `bun install`
- [ ] Test sign-in/sign-up flow locally
- [ ] Verify user data displays correctly
- [ ] Test protected routes
- [ ] Set up webhooks for production
- [ ] Update Vercel environment variables
- [ ] Deploy to production
- [ ] Test production authentication flow
- [ ] Monitor for errors in Sentry/logs
