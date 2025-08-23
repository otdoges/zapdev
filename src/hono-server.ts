import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trpcServer } from '@hono/trpc-server';
import { Checkout, CustomerPortal, Webhooks } from '@polar-sh/hono';
import { appRouter, createContext } from '../convex/trpc/router';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'https://zapdev.link', 'https://www.zapdev.link'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'hono-server', timestamp: new Date().toISOString() });
});

// tRPC integration
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
    onError: ({ error, path, type }) => {
      console.error(`Hono tRPC Error on ${path} (${type}):`, {
        error: error.message,
        stack: error.stack,
        path,
        type
      });
    },
  })
);

// Initialize Polar.sh SDK
const getPolarClient = () => {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('POLAR_ACCESS_TOKEN environment variable is required');
  }
  
  return new Polar({
    accessToken,
    // Use sandbox for development
    server: process.env.NODE_ENV === 'production' ? undefined : 'sandbox'
  });
};

// Helper function to verify Clerk authentication
async function verifyClerkToken(authHeader: string): Promise<{ id: string; email?: string } | null> {
  try {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    
    if (!issuer || !token) {
      return null;
    }
    
    const audience = process.env.CLERK_JWT_AUDIENCE;
    const { verifyToken } = await import('@clerk/backend');
    
    const options: { jwtKey?: string; audience?: string } = { jwtKey: issuer };
    if (audience) options.audience = audience;
    
    const verified = await verifyToken(token, options) as { sub?: string; email?: string };
    
    if (!verified.sub) return null;
    
    return { id: verified.sub, email: verified.email };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Authentication middleware
const authenticateUser = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({ error: 'Authorization header required' }, 401);
  }
  
  const user = await verifyClerkToken(authHeader);
  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  c.set('user', user);
  await next();
};

// Polar.sh Checkout endpoint using official Hono integration
app.get(
  '/checkout',
  authenticateUser,
  Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    successUrl: `${process.env.PUBLIC_ORIGIN || 'http://localhost:8080'}/success`,
    server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    theme: 'dark',
  })
);

// Get subscription status
app.get('/subscription', authenticateUser, async (c) => {
  try {
    const user = c.get('user');
    const polar = getPolarClient();
    
    // Get user's subscriptions from Polar.sh
    const subscriptions = await polar.subscriptions.list({
      // Filter by customer if available
      limit: 10
    });
    
    // Find active subscription for this user
    // Note: You'll need to implement customer mapping logic based on your setup
    const activeSubscription = subscriptions.items?.find(sub => 
      sub.status === 'active' && sub.metadata?.userId === user.id
    );
    
    if (!activeSubscription) {
      return c.json({
        planId: 'free',
        planName: 'Free',
        status: 'none',
        features: [
          '10 AI conversations per month',
          'Basic code execution',
          'Community support',
          'Standard response time',
        ],
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now(),
        cancelAtPeriodEnd: false,
      });
    }
    
    const planId = activeSubscription.metadata?.planId || 'pro';
    const features = planId === 'enterprise' 
      ? ['Everything in Pro', 'Dedicated support', 'SLA guarantee', 'Custom deployment']
      : planId === 'pro'
      ? ['Unlimited AI conversations', 'Advanced code execution', 'Priority support']
      : ['100 AI conversations per month', 'Advanced code execution', 'Email support'];
    
    return c.json({
      planId,
      planName: planId.charAt(0).toUpperCase() + planId.slice(1),
      status: activeSubscription.status,
      features,
      currentPeriodStart: new Date(activeSubscription.currentPeriodStart).getTime(),
      currentPeriodEnd: new Date(activeSubscription.currentPeriodEnd).getTime(),
      cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd || false,
    });
    
  } catch (error) {
    console.error('Get subscription error:', error);
    return c.json({
      planId: 'free',
      planName: 'Free',
      status: 'none',
      features: ['Basic features'],
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now(),
      cancelAtPeriodEnd: false,
    });
  }
});

// Customer portal using official Hono integration
app.get(
  '/portal',
  authenticateUser,
  CustomerPortal({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    getCustomerId: (event) => {
      // Extract customer ID from query params or user context
      const customerId = event.req.query('customerId');
      return customerId || '';
    },
    server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  })
);

// Polar.sh webhook handler using official Hono integration
app.post('/webhooks/polar', Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    console.log('Received Polar webhook payload:', payload);
  },
  onCheckoutCreated: async (payload) => {
    console.log('Checkout created:', payload);
  },
  onSubscriptionCreated: async (payload) => {
    console.log('Subscription created:', payload);
    // TODO: Sync subscription data with Convex database
  },
  onSubscriptionUpdated: async (payload) => {
    console.log('Subscription updated:', payload);
    // TODO: Sync subscription data with Convex database
  },
  onSubscriptionCanceled: async (payload) => {
    console.log('Subscription canceled:', payload);
    // TODO: Set user back to free plan in database
  },
  onOrderCreated: async (payload) => {
    console.log('Order created:', payload);
  },
  onOrderPaid: async (payload) => {
    console.log('Order paid:', payload);
    // TODO: Activate subscription/benefits
  },
}));

// Default route
app.get('/', (c) => {
  return c.json({
    message: 'Hono.js server with Polar.sh integration',
    endpoints: {
      health: '/health',
      trpc: '/trpc/*',
      checkout: '/checkout',
      subscription: '/subscription',
      portal: '/portal',
      webhooks: '/webhooks/polar'
    }
  });
});

// Export for different runtimes
export default app;

// For Node.js runtime
export const startServer = (port = 3001) => {
  if (typeof Bun !== 'undefined') {
    // Running on Bun
    console.log(`🚀 Hono.js server starting on http://localhost:${port}`);
    return Bun.serve({
      port,
      fetch: app.fetch,
    });
  } else {
    // Running on Node.js
    const serve = await import('@hono/node-server').then(m => m.serve);
    console.log(`🚀 Hono.js server starting on http://localhost:${port}`);
    return serve({
      fetch: app.fetch,
      port,
    });
  }
};

// Auto-start if this file is run directly
if (import.meta.main || require.main === module) {
  startServer();
}