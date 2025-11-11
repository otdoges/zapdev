# Better Auth + Polar.sh Setup Guide

## Overview

ZapDev now uses **Better Auth** for authentication and **Polar.sh** for subscription billing. This guide will help you set up and configure both systems.

## Table of Contents

1. [Better Auth Setup](#better-auth-setup)
2. [Polar.sh Setup](#polarsh-setup)
3. [Environment Variables](#environment-variables)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## Better Auth Setup

### 1. Install Dependencies

Better Auth is already installed in the project:
```bash
bun add better-auth
```

### 2. Generate Auth Secret

Generate a secure random secret for Better Auth:

```bash
openssl rand -base64 32
```

Add this to your `.env` file as `BETTER_AUTH_SECRET`.

### 3. Configure OAuth Providers (Optional)

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Create **OAuth 2.0 Client ID** credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Homepage URL: `http://localhost:3000`
4. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and generate Client Secret
6. Add to `.env`:
   ```bash
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```

### 4. Database Setup

Better Auth uses the Convex database with these tables:
- `users` - User accounts
- `sessions` - Active sessions
- `accounts` - OAuth provider accounts

These are automatically created when you run:
```bash
bun run convex:dev
```

---

## Polar.sh Setup

### 1. Create Polar Account

1. Sign up at [polar.sh](https://polar.sh)
2. Create an organization
3. Note your **Organization ID** from the dashboard

### 2. Create Products

1. In Polar dashboard, go to **Products**
2. Create a new product for "Pro Plan"
3. Set price to $29/month (or your preferred amount)
4. Enable recurring billing
5. Copy the **Product ID** (needed for `NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO`)

### 3. Get API Keys

1. Go to **Settings** → **API Keys**
2. Create a new access token
3. Copy the access token to `.env` as `POLAR_ACCESS_TOKEN`

### 4. Configure Webhooks

1. Go to **Settings** → **Webhooks**
2. Create a new webhook endpoint:
   - URL: `https://your-domain.com/api/polar/webhooks`
   - For local testing: Use [ngrok](https://ngrok.com/) or similar
3. Select events to subscribe to:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.active`
   - `subscription.canceled`
   - `subscription.revoked`
4. Copy the **Webhook Secret** to `.env` as `POLAR_WEBHOOK_SECRET`

---

## Environment Variables

Create a `.env` file in the project root with these variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Convex Database
NEXT_PUBLIC_CONVEX_URL=your-convex-url
CONVEX_DEPLOYMENT=your-deployment

# Better Auth
BETTER_AUTH_SECRET=your-generated-secret-from-step-2
BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Polar.sh Billing
POLAR_ACCESS_TOKEN=your-polar-access-token
POLAR_ORGANIZATION_ID=your-org-id
NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO=your-pro-product-id
POLAR_WEBHOOK_SECRET=your-webhook-secret

# AI & Other Services
AI_GATEWAY_API_KEY=your-ai-gateway-key
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1/
E2B_API_KEY=your-e2b-key
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

---

## Testing

### Test Authentication

1. **Sign Up**:
   - Navigate to `/sign-up`
   - Create account with email/password
   - Verify you can access `/dashboard`

2. **Sign In**:
   - Sign out and navigate to `/sign-in`
   - Sign in with credentials
   - Test OAuth sign-in (Google/GitHub)

3. **Session Persistence**:
   - Reload the page
   - Verify you stay signed in
   - Close and reopen browser
   - Check if session persists (should persist for 7 days)

4. **Protected Routes**:
   - Sign out
   - Try accessing `/dashboard` or `/projects/*`
   - Should redirect to `/sign-in`

### Test Billing

1. **View Pricing**:
   - Navigate to `/pricing`
   - Verify both Free and Pro plans display

2. **Subscribe to Pro** (use Polar test mode):
   - Click "Subscribe to Pro"
   - Complete checkout flow
   - Verify redirect back to dashboard
   - Check that credit limit increased to 100

3. **Manage Subscription**:
   - Click "Manage Subscription" on pricing page
   - Opens Polar customer portal
   - Test updating payment method
   - Test canceling subscription

4. **Webhook Testing** (local development):
   ```bash
   # Use ngrok to expose local webhook endpoint
   ngrok http 3000
   
   # Update Polar webhook URL to ngrok URL:
   # https://your-ngrok-url.ngrok.io/api/polar/webhooks
   
   # Trigger test events from Polar dashboard
   # Check webhook logs in your app
   ```

---

## Troubleshooting

### Better Auth Issues

**Problem**: "Unauthorized" error when accessing protected routes
- **Solution**: Check that `BETTER_AUTH_SECRET` is set and matches across all environments
- Verify the session cookie defined by `SESSION_COOKIE_NAME` exists in browser DevTools (defaults to `zapdev.session_token`)

**Problem**: OAuth redirect fails
- **Solution**: 
  - Verify callback URLs match exactly in OAuth provider settings
  - Check `BETTER_AUTH_URL` matches your app URL
  - For local dev, use `http://localhost:3000` (not `127.0.0.1`)

**Problem**: Session doesn't persist
- **Solution**:
  - Check browser cookies are enabled
  - Verify cookie domain settings
  - Check for CORS issues if frontend/backend on different domains

### Polar.sh Issues

**Problem**: Webhooks not received
- **Solution**:
  - Verify webhook URL is accessible publicly
  - Check webhook secret matches
  - Review Polar webhook logs in dashboard
  - Ensure endpoint returns 200 OK

**Problem**: Subscription status not updating
- **Solution**:
  - Check Convex database for `users` table updates
  - Verify `polarCustomerId` is linked correctly
  - Check webhook handler logs for errors
  - Manually trigger webhook test from Polar dashboard

**Problem**: Checkout session fails
- **Solution**:
  - Verify `POLAR_ACCESS_TOKEN` has correct permissions
  - Check product ID is correct and active
  - Ensure organization ID matches
  - Check Polar dashboard for error logs

### Database Issues

**Problem**: User not found after sign-up
- **Solution**:
  - Check Convex dashboard for `users` table
  - Verify user was created with correct email
  - Check database indexes are working
  - Review Convex logs for errors

**Problem**: Credits not updating after subscription
- **Solution**:
  - Verify `usage` table has entry for user
  - Check `plan` field in `users` table
  - Manually update plan if webhook missed:
    ```typescript
    // In Convex dashboard, run:
    await ctx.db.patch(userId, { 
      plan: "pro",
      subscriptionStatus: "active"
    });
    ```

---

## Production Deployment

### Environment Variables

Update these for production:

```bash
BETTER_AUTH_URL=https://your-production-domain.com
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### OAuth Redirect URIs

Update callback URLs in OAuth providers:
- Google: `https://your-domain.com/api/auth/callback/google`
- GitHub: `https://your-domain.com/api/auth/callback/github`

### Polar Webhooks

Update webhook URL in Polar dashboard:
- `https://your-domain.com/api/polar/webhooks`

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Generate new `BETTER_AUTH_SECRET` for production
- [ ] Enable CSRF protection
- [ ] Set secure cookie flags
- [ ] Rate limit authentication endpoints
- [ ] Monitor webhook failures
- [ ] Set up error tracking (Sentry already configured)

---

## Additional Resources

- [Better Auth Documentation](https://better-auth.com/docs)
- [Polar.sh API Documentation](https://docs.polar.sh)
- [Convex Authentication Guide](https://docs.convex.dev/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## Support

For issues or questions:
1. Check this guide first
2. Review migration document: `MIGRATION_CLERK_TO_BETTER_AUTH.md`
3. Check Convex dashboard logs
4. Review Polar dashboard webhook logs
5. Check application logs (Sentry for production errors)
