# Stripe Subscription with Clerk Authentication Setup Guide

This guide explains how to set up the complete Stripe subscription flow integrated with Clerk authentication in your React/Vite application.

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Vercel KV Configuration (if using Vercel KV)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Server Configuration
PORT=3001

# Development
NODE_ENV=development
```

## Setup Steps

### 1. Clerk Authentication Setup

1. Create a Clerk account at https://clerk.com
2. Create a new application in your Clerk dashboard
3. Get your publishable key and secret key
4. Configure sign-in/sign-up options in Clerk dashboard
5. Set up your redirect URLs:
   - Sign-in redirect: `/dashboard` or your preferred post-login page
   - Sign-out redirect: `/`

### 2. Stripe Dashboard Setup

1. Create a Stripe account at https://stripe.com
2. Create subscription products and prices in your Stripe dashboard
3. Note down the price IDs for use in your React components
4. Create a webhook endpoint pointing to your server: `https://yourdomain.com/api/stripe`
5. Configure webhook events: `checkout.session.completed`, `customer.subscription.created`, etc.

### 3. Backend Setup

#### Option A: Express Server (Recommended)

1. Install dependencies for your backend:
```bash
npm install express cors body-parser dotenv @clerk/clerk-sdk-node
npm install -D typescript ts-node @types/express @types/cors
```

2. The backend server is provided in `server/index.js`
3. To use the TypeScript API functions, you'll need to transpile them:
```bash
npx tsc src/api/*.ts src/lib/*.ts --outDir dist --target es2020 --module commonjs
```

4. Update the server to import the compiled functions (uncomment the lines in `server/index.js`)

#### Option B: Serverless Functions (Vercel, Netlify, etc.)

Create serverless functions that wrap the provided API functions.

### 4. Frontend Integration

#### App Setup with Clerk Provider

Update your main App component:

```tsx
import { ClerkProvider } from '@/components/ClerkProvider';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <ClerkProvider>
      <BrowserRouter>
        {/* Your app routes */}
      </BrowserRouter>
    </ClerkProvider>
  );
}
```

#### Using the Subscribe Button

```tsx
import { SubscribeButton } from '@/components/SubscribeButton';

function PricingPage() {
  return (
    <div>
      <SubscribeButton 
        priceId="price_1234567890" // Your Stripe price ID
        planName="Pro Plan"
        className="w-full"
      />
    </div>
  );
}
```

#### Using the Subscription Status Component

```tsx
import { SubscriptionStatus } from '@/components/SubscriptionStatus';

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <SubscriptionStatus />
    </div>
  );
}
```

#### Router Setup

Add the Success page to your router:

```tsx
import Success from '@/pages/Success';

// In your router configuration
{
  path: '/success',
  element: <Success />
}
```

## API Endpoints

### POST /api/generate-stripe-checkout
- **Purpose**: Creates a Stripe checkout session
- **Authentication**: Clerk JWT token (Bearer)
- **Body**: `{ priceId: string }`
- **Response**: `{ url: string }`

### POST /api/sync-after-success
- **Purpose**: Syncs subscription data after successful payment
- **Authentication**: Clerk JWT token (Bearer)
- **Body**: `{ sessionId?: string }`
- **Response**: `SubscriptionData`

### GET /api/subscription-status
- **Purpose**: Gets current user's subscription status
- **Authentication**: Clerk JWT token (Bearer)
- **Response**: `SubscriptionData`

### POST /api/stripe
- **Purpose**: Handles Stripe webhook events
- **Authentication**: Stripe signature verification
- **Body**: Raw Stripe webhook payload
- **Response**: `{ received: boolean }`

## KV Store Schema

The system uses the following KV key patterns:

- `stripe:user:{clerkUserId}` → `stripeCustomerId`
- `stripe:customer:{customerId}` → `SubscriptionData`

## Subscription Data Structure

```typescript
interface SubscriptionData {
  subscriptionId?: string;
  status: string;
  priceId?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
  } | null;
}
```

## Clerk Authentication Integration

### Frontend Authentication

Components automatically use Clerk's `useAuth()` hook:

```tsx
import { useAuth } from '@clerk/clerk-react';

function MyComponent() {
  const { isSignedIn, user, getToken } = useAuth();
  
  // Component logic
}
```

### Backend Authentication

API functions use Clerk JWT verification:

```typescript
import { authenticateWithClerk } from '@/lib/clerk-auth';

// In your API functions
const user = await authenticateWithClerk(headers);
// Returns: { id: string, email: string, name?: string, ... }
```

### User Data Mapping

The system automatically maps Clerk users to Stripe customers:

1. User signs up/logs in with Clerk
2. When they subscribe, system creates Stripe customer
3. Maps `clerkUserId` → `stripeCustomerId` in KV store
4. All future operations use this mapping

## Webhook Security

The webhook handler verifies Stripe signatures to ensure requests are legitimate. Make sure to:

1. Keep your webhook secret secure
2. Use HTTPS in production
3. Configure webhook events only for what you need

## Authentication Flow

1. **User signs up/logs in** via Clerk
2. **User clicks subscribe** → Gets Clerk JWT token
3. **Backend creates checkout** → Maps Clerk user to Stripe customer
4. **User completes payment** → Redirected to success page
5. **Success page syncs data** → Uses Clerk token to verify user
6. **Webhooks update data** → Real-time subscription updates

## Testing

1. Set up Clerk in test mode
2. Use Stripe's test mode with test cards
3. Test the complete flow: login → subscription → payment → webhook → KV sync
4. Monitor webhook events in Stripe dashboard
5. Check KV store for proper data persistence
6. Verify Clerk user sessions work correctly

## Production Deployment

### Clerk Configuration
1. Update Clerk to production instance
2. Configure production redirect URLs
3. Set up custom domains if needed

### Stripe Configuration
1. Update all Stripe keys to production values
2. Configure webhook endpoint with your production URL
3. Enable webhook signing secret

### Security
1. Enable rate limiting on API endpoints
2. Set up proper error monitoring and logging
3. Configure CORS properly for your domain
4. Use HTTPS everywhere

## Error Handling

The system includes comprehensive error handling:

- Clerk authentication state management
- Automatic token refresh
- Graceful fallbacks for failed API calls
- Webhook signature verification
- KV store error recovery
- User-friendly error messages

## Components Overview

### Core Components
- `ClerkProvider` - Wraps app with Clerk authentication
- `SubscribeButton` - Handles subscription initiation
- `SubscriptionStatus` - Displays current subscription info
- `Success` - Post-payment confirmation and sync

### API Functions
- `authenticateWithClerk()` - Verifies Clerk JWT tokens
- `generateStripeCheckout()` - Creates checkout sessions
- `syncAfterSuccess()` - Syncs post-payment data
- `handleStripeWebhook()` - Processes webhook events

## Support

For issues with this implementation:
1. Check Clerk dashboard for user sessions
2. Check Stripe dashboard for webhook delivery status
3. Monitor server logs for API errors
4. Verify KV store connectivity
5. Test with Stripe's webhook testing tools
6. Verify Clerk JWT token validity

## Next Steps

1. Customize Clerk sign-in/sign-up flows
2. Add subscription plan management
3. Implement billing portal integration
4. Add usage-based billing if needed
5. Set up customer success workflows 