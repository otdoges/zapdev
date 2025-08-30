# Clerk JWT Template Setup Guide

This guide explains how to set up and use Clerk JWT templates with your Next.js and Convex application.

## Overview

Your application already has Clerk authentication integrated with Convex. The JWT template allows you to customize the tokens that Clerk generates, adding custom claims that can be accessed both in your Next.js application and in your Convex backend functions.

## Current Setup Status

✅ **Already Configured:**
- Clerk authentication with Next.js (`@clerk/nextjs`)
- Convex integration (`ConvexProviderWithClerk`)
- Authentication middleware (`middleware.ts`)
- Convex auth configuration (`convex/auth.config.js`)
- Environment variables structure (`.env.example`)

## Step 1: Create JWT Template in Clerk Dashboard

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **JWT Templates** in the left sidebar
3. Click **New Template**
4. Select **Convex** from the template list
5. **IMPORTANT:** The template MUST be named exactly `convex` (do not rename it)
6. Customize your template with the claims you need:

```json
{
  "aud": "convex",
  "fullName": "{{user.first_name}} {{user.last_name}}",
  "primaryEmail": "{{user.primary_email_address}}",
  "username": "{{user.username}}",
  "imageUrl": "{{user.image_url}}"
}
```

7. Save the template and copy the **Issuer URL** (should look like `https://your-app.clerk.accounts.dev`)

## Step 2: Update Environment Variables

Add the issuer URL to your `.env.local` file:

```bash
# Required for Convex JWT authentication - Your Clerk Frontend API URL
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-subdomain.clerk.accounts.dev

# Also ensure you have these Clerk variables:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Step 3: Deploy Convex Configuration

After updating your environment variables, push the configuration to Convex:

```bash
bun run convex dev
# or for production:
bun run convex deploy
```

## Step 4: Test Your Setup

### Option A: Using the Test API Route

Visit `/api/test-jwt` in your browser (while logged in) to see if JWT authentication is working:

```bash
# Example response:
{
  "success": true,
  "message": "JWT authentication is working correctly",
  "data": {
    "userId": "user_...",
    "hasCustomClaims": true,
    "customClaims": {
      "fullName": "John Doe",
      "primaryEmail": "john@example.com"
    }
  }
}
```

### Option B: Using Convex Functions

You can test the authentication in your Convex functions using the provided examples in `convex/jwtAuth.ts`:

```typescript
// In your React component:
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const user = useQuery(api.jwtAuth.getCurrentUser);
console.log("Current user:", user);
```

## Step 5: Using Custom Claims

### In Next.js API Routes

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { sessionClaims, userId } = await auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Access your custom claims
  const fullName = sessionClaims?.fullName;
  const email = sessionClaims?.primaryEmail;
  
  return Response.json({ userId, fullName, email });
}
```

### In Convex Functions

```typescript
import { query } from './_generated/server';

export const getUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }
    
    return {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
      // Access other claims from your JWT template
    };
  },
});
```

### In React Components

```typescript
import { useAuth } from '@clerk/nextjs';

function UserProfile() {
  const { sessionClaims, userId } = useAuth();
  
  if (!userId) return <div>Not logged in</div>;
  
  return (
    <div>
      <h1>Welcome, {sessionClaims?.fullName}</h1>
      <p>Email: {sessionClaims?.primaryEmail}</p>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Template name is not "convex"**: The JWT template MUST be named exactly `convex`
2. **Wrong issuer URL**: Make sure `CLERK_JWT_ISSUER_DOMAIN` matches your Clerk Frontend API URL
3. **Convex not synced**: Run `bun run convex dev` or `bun run convex deploy` after changing environment variables
4. **Cache issues**: Clear browser cache or restart your development server

### Debug Steps

1. Check that your environment variables are set correctly
2. Verify the JWT template exists in Clerk Dashboard and is named "convex"
3. Test the authentication using `/api/test-jwt`
4. Check the browser's Network tab for authentication requests
5. Look at server logs for any authentication errors

## TypeScript Support

Custom types for JWT claims are defined in `types/globals.d.ts`. Update this file to match your JWT template:

```typescript
interface CustomJwtSessionClaims {
  fullName?: string;
  primaryEmail?: string;
  username?: string;
  imageUrl?: string;
  // Add your custom claims here
}
```

## Security Notes

- JWT tokens contain sensitive user information - handle them securely
- Custom claims are limited to ~1.2KB to avoid cookie size issues
- Tokens are automatically validated by Convex using Clerk's public keys
- Always check for user authentication before accessing sensitive data

## Next Steps

1. Customize your JWT template with the claims you need
2. Update your Convex functions to use the authenticated user data
3. Build your application features using the authenticated user context
4. Consider implementing role-based access control using custom claims

Your JWT authentication setup is now complete! 🎉