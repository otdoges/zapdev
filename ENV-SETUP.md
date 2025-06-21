# Environment Setup Guide

This project uses Better Auth for authentication with GitHub and Google providers. Follow these steps to set up your environment.

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Better Auth Configuration
BETTER_AUTH_SECRET=your_random_secret_key_here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# OpenRouter API key for the AI chat functionality
NEXT_OPENROUTER_API_KEY=your_openrouter_key_here

# Gemini API key for prompt enhancement
GEMINI_API_KEY=your_gemini_key_here

# GitHub OAuth App
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Google OAuth App
GOOGLE_CLIENT_ID=your_google_oauth_client_id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Convex deployment URL
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Polar.sh Configuration (for payments and subscriptions)
POLAR_ACCESS_TOKEN=polar_at_your_access_token
POLAR_SERVER=sandbox
POLAR_PRODUCT_ID=your_polar_product_id
POLAR_BASIC_PRODUCT_ID=your_polar_basic_product_id
POLAR_PRO_PRODUCT_ID=your_polar_pro_product_id
POLAR_ENTERPRISE_PRODUCT_ID=your_polar_enterprise_product_id
POLAR_SUCCESS_URL=http://localhost:3000/success
POLAR_WEBHOOK_SECRET=polar_wh_your_webhook_secret

# Optional: Stripe for future billing (deprecated in favor of Polar)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Optional: PostHog for analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Getting API Keys

### Better Auth Secret
Generate a random secret key for Better Auth:
```bash
openssl rand -base64 32
```
Or use an online generator. This should be a random 32+ character string.

### Polar.sh Setup
1. Go to [Polar.sh](https://polar.sh/) and create an account
2. Create an organization
3. Go to Organization Settings → Access Tokens
4. Create a new access token with appropriate permissions
5. Copy the token and paste it as `POLAR_ACCESS_TOKEN` in your `.env.local` file
6. Create a product in your Polar dashboard
7. Copy the product ID and paste it as `POLAR_PRODUCT_ID` in your `.env.local` file
8. Set up webhooks in Polar dashboard pointing to: `https://yourdomain.com/api/polar/webhooks`
9. Copy the webhook secret and paste it as `POLAR_WEBHOOK_SECRET` in your `.env.local` file
10. Set `POLAR_SERVER` to `sandbox` for testing or `production` for live

### OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign in or create an account
3. Create a new API key
4. Copy the key and paste it in your `.env.local` file

### Gemini API Key
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in or create an account
3. Get an API key from the API keys section
4. Copy the key and paste it in your `.env.local` file

### GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: `ZapDev`
   - Homepage URL: `http://localhost:3000` (for development)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret
5. Paste them in your `.env.local` file

### Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials → Create Credentials → OAuth client ID
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy the Client ID and Client Secret
8. Paste them in your `.env.local` file

### Convex Setup
1. Sign up for [Convex](https://dashboard.convex.dev/)
2. Create a new project
3. Run `bunx convex dev` to set up your development deployment
4. Copy the deployment URL from the dashboard
5. Update your schema by running `bunx convex dev` again

## Polar.sh Integration Features

This app now includes Polar.sh integration with the following features:

1. **Automatic Customer Creation** - Users are automatically created as Polar customers on signup
2. **Checkout Integration** - Available at `/api/polar/checkout?productId=YOUR_PRODUCT_ID`
3. **Customer Portal** - Available at `/api/polar/portal` for authenticated users
4. **Webhook Handling** - Polar webhooks are processed at `/api/polar/webhooks`

### Using Polar Checkout

To create a checkout link, redirect users to:
```
/api/polar/checkout?productId=YOUR_PRODUCT_ID&customerEmail=user@example.com
```

Available query parameters:
- `productId` or `productPriceId` (required)
- `customerId` (optional)
- `customerExternalId` (optional)
- `customerEmail` (optional)
- `customerName` (optional)
- `metadata` (optional, URL-encoded JSON string)

## Authentication Flow

This app uses Better Auth for modern OAuth authentication:

1. **Users visit `/auth`** - Beautiful auth page with GitHub/Google options
2. **OAuth flow** - Users are redirected to GitHub/Google for authorization
3. **Callback handling** - Better Auth handles the OAuth callback automatically
4. **User sync** - User data is synced with Convex database via callbacks
5. **Polar customer creation** - Users are automatically created as Polar customers
6. **Session management** - Better Auth manages secure sessions
7. **Redirect** - Users are sent to the chat interface

## Verifying Your Setup

1. Set up your environment variables in `.env.local`
2. Start your Convex development server:
   ```bash
   bunx convex dev
   ```
3. In another terminal, run the development server:
   ```bash
   bun run dev
   ```
4. Visit `http://localhost:3000/auth` to test authentication
5. Try signing in with GitHub or Google
6. Test Polar checkout by visiting `/api/polar/checkout?productId=YOUR_PRODUCT_ID`

If everything is configured correctly, you should be able to authenticate, access the customer portal, and process payments through Polar.sh! 