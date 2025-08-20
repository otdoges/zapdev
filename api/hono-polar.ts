import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { Checkout, Webhooks } from '@polar-sh/hono';
import { verifyClerkToken } from './_utils/auth';
import { Polar } from '@polar-sh/sdk';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const app = new Hono();

// Helper function to get Polar client
const getPolarClient = () => {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('POLAR_ACCESS_TOKEN environment variable is required');
  }
  
  return new Polar({
    accessToken,
    server: process.env.NODE_ENV === 'production' ? undefined : 'sandbox'
  });
};

// Helper function to get Convex client
const getConvexClient = () => {
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error('CONVEX_URL environment variable is required');
  }
  
  return new ConvexHttpClient(convexUrl);
};

// Helper function to sync subscription data to Convex
const syncSubscriptionToConvex = async (subscription: {
  id?: string;
  status: string;
  metadata?: { userId?: string; planId?: string };
  product?: { name?: string };
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  created_at?: string;
  cancel_at_period_end?: boolean;
}, action: 'created' | 'updated' | 'canceled') => {
  try {
    const convex = getConvexClient();
    
    // Extract user ID from subscription metadata
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.warn(`No userId found in subscription metadata for subscription ID: ${subscription.id}`);
      return;
    }

    // Map Polar.sh status to our status format
    const mapPolarStatus = (status: string) => {
      switch (status) {
        case 'active':
          return 'active';
        case 'canceled':
          return 'canceled';
        case 'past_due':
          return 'past_due';
        case 'incomplete':
          return 'incomplete';
        case 'trialing':
          return 'trialing';
        default:
          return 'none';
      }
    };

    // Determine plan ID from subscription metadata or product info
    const planId = subscription.metadata?.planId || 
                  (subscription.product?.name?.toLowerCase().includes('pro') ? 'pro' : 'starter');

    const subscriptionData = {
      userId,
      planId,
      status: mapPolarStatus(subscription.status),
      currentPeriodStart: new Date(subscription.currentPeriodStart || subscription.created_at).getTime(),
      currentPeriodEnd: new Date(subscription.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).getTime(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    };

    // For canceled subscriptions, we might want to set them to free plan
    if (action === 'canceled') {
      subscriptionData.planId = 'free';
      subscriptionData.status = 'canceled' as const;
    }

    // Call Convex mutation to update subscription
    await convex.mutation(api.users.upsertUserSubscription, subscriptionData);
    
    console.log(`Successfully synced ${action} subscription for user ${userId} with plan ${subscriptionData.planId}`);
  } catch (error) {
    console.error(`Failed to sync subscription to Convex:`, error);
    throw error;
  }
};

// Add CORS middleware
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || '*';
  const allowedOrigins = ['http://localhost:8080', 'https://zapdev.link', 'https://www.zapdev.link'];
  
  if (origin === '*' || allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  }
  
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Polar-Webhook-Signature');
  c.header('Access-Control-Allow-Credentials', 'true');
  
  if (c.req.method === 'OPTIONS') {
    return new Response('', { status: 204 });
  }
  
  await next();
});

// Helper function to verify Clerk authentication
async function verifyClerkAuth(authHeader: string): Promise<{ id: string; email?: string } | null> {
  try {
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    const audience = process.env.CLERK_JWT_AUDIENCE;
    
    if (!issuer) {
      return null;
    }
    
    const verified = await verifyClerkToken(authHeader, issuer, audience);
    
    if (!verified?.sub) return null;
    
    return { id: verified.sub, email: verified.email as string | undefined };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Authentication middleware  
const authenticateUser = async (c: import('hono').Context, next: import('hono').Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({ error: 'Authorization header required' }, 401);
  }
  
  const user = await verifyClerkAuth(authHeader);
  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  c.set('user', user);
  await next();
};

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    service: 'hono-polar-serverless',
    timestamp: new Date().toISOString(),
    endpoints: {
      checkout: '/checkout',
      portal: '/portal',
      webhooks: '/webhooks'
    }
  });
});

// Polar.sh Checkout endpoint 
app.get('/checkout', authenticateUser, async (c) => {
  try {
    const user = c.get('user') as { id: string; email?: string };
    const planId = c.req.query('planId');
    const period = c.req.query('period') || 'month';
    
    if (!planId) {
      return c.json({ error: 'planId query parameter is required' }, 400);
    }

    // Map plan IDs to Polar.sh product IDs
    const productIdMap: Record<string, Record<string, string>> = {
      'starter': {
        'month': process.env.POLAR_PRODUCT_STARTER_MONTH_ID || '',
        'year': process.env.POLAR_PRODUCT_STARTER_YEAR_ID || '',
      },
      'pro': {
        'month': process.env.POLAR_PRODUCT_PRO_MONTH_ID || '',
        'year': process.env.POLAR_PRODUCT_PRO_YEAR_ID || '',
      },
    };
    
    const planMap = productIdMap[planId as keyof typeof productIdMap];
    const productId = planMap?.[period as keyof typeof planMap];
    
    if (!productId) {
      return c.json({ error: `Plan ${planId} with period ${period} is not supported` }, 400);
    }

    // Create checkout URL with query parameters for Polar.sh Hono adapter
    const checkoutUrl = new URL(`${c.req.url.split('/checkout')[0]}/checkout-polar`);
    checkoutUrl.searchParams.set('products', productId);
    checkoutUrl.searchParams.set('customerEmail', user.email || '');
    checkoutUrl.searchParams.set('metadata', JSON.stringify({
      userId: user.id,
      planId,
      period
    }));
    
    return c.redirect(checkoutUrl.toString());
  } catch (error) {
    console.error('Checkout redirect error:', error);
    return c.json({ error: 'Failed to create checkout' }, 500);
  }
});

// Direct Polar.sh checkout using official adapter
app.get('/checkout-polar', Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.PUBLIC_ORIGIN || 'http://localhost:8080'}/success`,
  server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  theme: 'dark',
}));

// Customer portal endpoint
app.get('/portal', authenticateUser, async (c) => {
  try {
    const user = c.get('user') as { id: string; email?: string };
    
    // For now, redirect to Polar.sh dashboard since we need the customer ID mapping
    // In production, you'd want to store the Polar customer ID in your database
    const portalUrl = process.env.NODE_ENV === 'production' 
      ? 'https://polar.sh/dashboard/subscriptions'
      : 'https://sandbox.polar.sh/dashboard/subscriptions';
    
    console.log('Redirecting user to portal:', user.id);
    
    return c.json({
      url: portalUrl,
      message: 'Redirecting to subscription management dashboard'
    });
  } catch (error) {
    console.error('Portal error:', error);
    return c.json({ error: 'Failed to access portal' }, 500);
  }
});

// Get subscription status endpoint
app.get('/subscription', authenticateUser, async (c) => {
  try {
    const user = c.get('user') as { id: string; email?: string };
    console.log('Getting subscription for user:', user.id);
    
    try {
      const polar = getPolarClient();
      
      // Get user's subscriptions from Polar.sh
      const subscriptions = await polar.subscriptions.list({
        limit: 100
      });
      
      // Find active subscription for this user
      const subscriptionList = Array.isArray(subscriptions) ? subscriptions : [];
      const activeSubscription = subscriptionList.find((sub: { status: string; metadata?: { userId?: string } }) => 
        (sub.status === 'active' || sub.status === 'trialing') && 
        sub.metadata?.userId === user.id
      );
      
      if (!activeSubscription) {
        // Return free plan
        return c.json({
          planId: 'free',
          planName: 'Free',
          status: 'none',
          features: { conversations: 10, advancedFeatures: false },
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        });
      }
      
      // Determine plan ID from subscription metadata
      const planId = activeSubscription.metadata?.planId || 'pro';
      const features = planId === 'starter' 
        ? { conversations: 100, advancedFeatures: true }
        : { conversations: -1, advancedFeatures: true };
      
      return c.json({
        planId,
        planName: planId === 'starter' ? 'Starter' : 'Pro',
        status: activeSubscription.status,
        features,
        currentPeriodStart: new Date(activeSubscription.currentPeriodStart).getTime(),
        currentPeriodEnd: new Date(activeSubscription.currentPeriodEnd).getTime(),
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd || false,
      });
      
    } catch (polarError) {
      console.warn('Failed to fetch subscriptions from Polar.sh:', polarError);
      
      // Fallback to free plan
      return c.json({
        planId: 'free',
        planName: 'Free',
        status: 'none',
        features: { conversations: 10, advancedFeatures: false },
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      });
    }
  } catch (error) {
    console.error('Get subscription error:', error);
    return c.json({ error: 'Failed to get subscription' }, 500);
  }
});

// Polar.sh webhook handler using official Hono integration
app.post('/webhooks', Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    console.log('Received Polar webhook payload:', payload);
  },
  onCheckoutCreated: async (payload) => {
    console.log('Checkout created:', payload);
  },
  onSubscriptionCreated: async (payload) => {
    console.log('Subscription created:', payload);
    try {
      await syncSubscriptionToConvex(payload.data, 'created');
    } catch (error) {
      console.error('Failed to sync created subscription:', error);
    }
  },
  onSubscriptionUpdated: async (payload) => {
    console.log('Subscription updated:', payload);
    try {
      await syncSubscriptionToConvex(payload.data, 'updated');
    } catch (error) {
      console.error('Failed to sync updated subscription:', error);
    }
  },
  onSubscriptionCanceled: async (payload) => {
    console.log('Subscription canceled:', payload);
    try {
      await syncSubscriptionToConvex(payload.data, 'canceled');
    } catch (error) {
      console.error('Failed to sync canceled subscription:', error);
    }
  },
  onOrderCreated: async (payload) => {
    console.log('Order created:', payload);
  },
  onOrderPaid: async (payload) => {
    console.log('Order paid:', payload);
    try {
      // Order paid might indicate a subscription should be activated
      // Check if this order is related to a subscription
      if (payload.data.subscription) {
        console.log('Order has associated subscription, will be handled by subscription webhook');
      } else {
        console.log('One-time order paid - no subscription sync needed');
      }
    } catch (error) {
      console.error('Failed to process paid order:', error);
    }
  },
}));

// Export the Vercel handler with explicit method exports
const handler = handle(app);

export default handler;
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;