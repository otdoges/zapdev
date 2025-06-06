# Environment Setup Guide

This project requires several API keys to work properly. Follow these steps to set up your environment.

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# OpenAI API key for the AI chat functionality
OPENAI_API_KEY=your_openai_key_here

# Clerk authentication keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Convex deployment URL
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

## Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Create a new API key
4. Copy the key and paste it in your `.env.local` file

### Clerk Authentication Keys
1. Go to [Clerk Dashboard](https://dashboard.clerk.dev/)
2. Create a new application or select an existing one
3. Go to API Keys in the sidebar
4. Copy the Publishable Key and Secret Key
5. For the webhook secret, go to Webhooks in the sidebar and create a new webhook endpoint

### Convex URL
1. Sign up for [Convex](https://dashboard.convex.dev/)
2. Create a new project
3. Copy the deployment URL from the dashboard

## Verifying Your Setup

After setting up your environment variables, run the development server:

```bash
npm run dev
# or
yarn dev
# or
bun run dev
```

If everything is configured correctly, you should be able to use the AI chat functionality and authentication features. 