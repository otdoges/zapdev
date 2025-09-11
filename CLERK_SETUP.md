# Clerk Authentication Setup

This document outlines the Clerk authentication implementation in your ZapDev application.

## What's Been Implemented

### 1. Dependencies
- `@clerk/nextjs` - Main Clerk Next.js package
- `@clerk/clerk-react` - React components and hooks
- `convex` - Convex database client
- Integrated with existing Convex backend

### 2. Environment Variables
Add these to your `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/generation
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/generation

# Convex integration
CLERK_JWT_ISSUER_DOMAIN="https://your-clerk-domain.clerk.accounts.dev"
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
```

### 3. Key Components

#### App Structure
- **Root Layout** (`app/layout.tsx`): Wrapped with `ClerkProvider` and `ConvexClientProvider`
- **Middleware** (`middleware.ts`): Route protection with public/protected routes
- **Convex Provider** (`lib/ConvexClientProvider.tsx`): Integrates Clerk auth with Convex

#### Authentication Pages
- **Sign In** (`app/sign-in/[[...sign-in]]/page.tsx`): Custom styled sign-in page
- **Sign Up** (`app/sign-up/[[...sign-up]]/page.tsx`): Custom styled sign-up page

#### UI Components
- **UserAuth** (`components/shared/header/UserAuth/UserAuth.tsx`): Header authentication component
  - Shows "Sign In" button for unauthenticated users
  - Shows user profile button for authenticated users

### 4. Protected Routes
- **Home Page** (`/`): Public - includes sign-in option in header
- **Generation Page** (`/generation`): Protected - requires authentication
- **API Routes**: Public search and model detection, protected generation features

### 5. Convex Integration
Your existing Convex backend is already configured:
- `convex/auth.config.js`: JWT authentication config
- `convex/jwtAuth.ts`: Example authentication functions
- `convex/schema.ts`: User tables ready for Clerk integration

## Setup Instructions

### 1. Create Clerk Application
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your publishable and secret keys

### 2. Update Environment Variables
Replace the placeholder values in `.env.local` with your actual Clerk keys:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: From Clerk dashboard
- `CLERK_SECRET_KEY`: From Clerk dashboard  
- `CLERK_JWT_ISSUER_DOMAIN`: Your Clerk domain (format: `https://your-app-name-1234.clerk.accounts.dev`)

### 3. Configure Clerk JWT Template
In Clerk dashboard:
1. Go to **JWT Templates** 
2. Create a new template named "convex"
3. Add these claims to match your Convex schema:
```json
{
  "iss": "{{JWT_ISSUER_DOMAIN}}",
  "sub": "{{USER_ID}}",
  "email": "{{USER_EMAIL}}",
  "name": "{{USER_FIRST_NAME}} {{USER_LAST_NAME}}",
  "given_name": "{{USER_FIRST_NAME}}",
  "family_name": "{{USER_LAST_NAME}}",
  "picture": "{{USER_PROFILE_IMAGE_URL}}"
}
```

### 4. Deploy Convex (if not already done)
1. Install Convex CLI: `npm install -g convex`
2. Run `convex dev` to deploy your functions
3. Copy the deployment URL to `NEXT_PUBLIC_CONVEX_URL`

### 5. Update Convex Auth Config
Make sure `convex/auth.config.js` uses the correct issuer domain:
```js
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

## Features Available

### For Users
- **Sign up/Sign in**: Easy authentication flow
- **User Profile**: Managed through Clerk's user button
- **Protected Access**: Generation features require authentication
- **Seamless Experience**: Auto-redirect after sign-in

### For Developers
- **User Context**: Access user data via `useUser()` hook
- **Convex Integration**: Authenticated queries and mutations
- **Route Protection**: Automatic middleware protection
- **JWT Authentication**: Secure API access with Convex

## Usage Examples

### Check Authentication Status
```tsx
import { useUser } from '@clerk/nextjs';

function MyComponent() {
  const { isLoaded, isSignedIn, user } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Please sign in</div>;
  
  return <div>Hello {user.firstName}!</div>;
}
```

### Use Convex with Authentication
```tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function MyData() {
  const userProfile = useQuery(api.jwtAuth.getCurrentUser);
  
  return (
    <div>
      {userProfile ? (
        <p>Welcome {userProfile.name}!</p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
}
```

## Next Steps

1. **Customize Styling**: Update Clerk components appearance to match your design
2. **Add User Onboarding**: Create welcome flow for new users  
3. **Implement User Profiles**: Use Convex functions to store additional user data
4. **Add Role-Based Access**: Extend authentication for different user types
5. **Set up Webhooks**: Sync user data between Clerk and Convex

Your authentication system is now fully integrated and ready to use!