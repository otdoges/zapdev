# Environment Setup Guide

This project uses Supabase for authentication with GitHub and Google providers. Follow these steps to set up your environment.

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Supabase Configuration ⭐ REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Groq API key for AI chat functionality with reasoning models
GROQ_API_KEY=your_groq_api_key_here

# OpenRouter API key (optional, for fallback)
NEXT_OPENROUTER_API_KEY=your_openrouter_key_here

# Gemini API key for prompt enhancement
GEMINI_API_KEY=your_gemini_key_here

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

### Groq API Key ⭐ NEW!
1. Go to [Groq Console](https://console.groq.com/)
2. Sign in or create a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it as `GROQ_API_KEY` in your `.env.local` file

**Features you get with Groq:**
- **DeepSeek R1 Distill Qwen 32B**: Advanced reasoning model with step-by-step problem solving
- **Qwen QwQ 32B**: Large-scale reasoning model with enhanced query understanding  
- **Fast inference**: Lightning-fast responses with generous free tier
- **Reasoning visibility**: See the AI's thought process with `reasoningFormat` options
- **Large context windows**: Up to 8K tokens for complex conversations

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

### OpenRouter API Key (Optional)
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign in or create an account
3. Create a new API key
4. Copy the key and paste it in your `.env.local` file

### Gemini API Key
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in or create an account
3. Get an API key from the API keys section
4. Copy the key and paste it in your `.env.local` file

### Supabase Setup ⭐ CRITICAL CONFIGURATION
1. Go to [Supabase](https://supabase.com/) and create a new project
2. **Step 1 - Get API Credentials:**
   - Go to Settings → API
   - Copy the Project URL and paste it as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the anon public key and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Step 2 - Configure Authentication URLs (VERY IMPORTANT):**
   - Go to Authentication → URL Configuration
   - Set **Site URL**: `http://localhost:3000`
   - Set **Redirect URLs**: `http://localhost:3000/auth/callback`
   - For production, also add your production domain

4. **Step 3 - Enable GitHub OAuth:**
   - Go to Authentication → Providers
   - Enable GitHub provider
   - In GitHub, create an OAuth App with callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
   - Add GitHub Client ID and Secret to Supabase

**🚨 COMMON ISSUE FIX:** If you see "Failed to launch localhost:3001" error, check that your Supabase redirect URLs are set to `http://localhost:3000/auth/callback` (not 3001).

### GitHub OAuth App (for Supabase)
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: `ZapDev`
   - Homepage URL: `http://localhost:3000` (for development)
   - Authorization callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret
5. Add them to your Supabase dashboard under Authentication → Providers → GitHub

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

This app uses Supabase for secure authentication:

1. **Users visit `/auth`** - Beautiful auth page with GitHub/Google options
2. **OAuth flow** - Users are redirected to GitHub/Google for authorization
3. **Callback handling** - Supabase handles the OAuth callback at `/auth/callback`
4. **User sync** - User data is synced with Supabase database
5. **Polar customer creation** - Users are automatically created as Polar customers
6. **Session management** - Supabase manages secure sessions with automatic refresh
7. **Redirect** - Users are sent to the chat interface

## Troubleshooting Authentication Issues

### "Failed to launch localhost:3001" Error
**Problem:** OAuth callback is redirecting to wrong port
**Solution:** 
1. Check your Supabase project settings (Authentication → URL Configuration)
2. Ensure redirect URLs are set to: `http://localhost:3000/auth/callback`
3. Restart your dev server to ensure it's running on port 3000

### "Invalid login credentials" Error
**Problem:** Email/password mismatch or user doesn't exist
**Solution:**
1. Try the "Forgot Password" link
2. Ensure you're using the same provider (GitHub vs Email) you signed up with
3. Check if email confirmation is required in Supabase settings

## Verifying Your Setup

1. Set up your environment variables in `.env.local`
2. Run the development server:
   ```bash
   bun run dev
   ```
3. Visit `http://localhost:3000/auth` to test authentication
4. Try signing in with GitHub
5. Check the browser console for any authentication errors
6. Test Polar checkout by visiting `/api/polar/checkout?productId=YOUR_PRODUCT_ID`

**✅ Success indicators:**
- No "Supabase not configured" warnings in console
- GitHub sign-in redirects properly
- You can access `/chat` after authentication
- User session persists on page refresh

**❌ If you see errors:**
- Check that all environment variables are set correctly
- Verify Supabase redirect URLs match exactly: `http://localhost:3000/auth/callback`
- Ensure GitHub OAuth app callback URL uses your Supabase project URL
- Check browser network tab for failed requests 