import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trpcServer } from '@hono/trpc-server';
import { Checkout, CustomerPortal, Webhooks } from '@polar-sh/hono';
import { Polar } from '@polar-sh/sdk';
import { appRouter, createContext } from '../convex/trpc/router';

// Define user type
type AuthenticatedUser = {
  id: string;
  email?: string;
};

// Define app environment with Variables
type AppEnv = {
  Variables: {
    user: AuthenticatedUser;
  };
};

const app = new Hono<AppEnv>();

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
    createContext: async ({ req }) => {
      const context = await createContext({ req });
      return context as Record<string, unknown>;
    },
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
async function verifyClerkToken(authHeader: string): Promise<AuthenticatedUser | null> {
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
const authenticateUser = async (c: Context<AppEnv>, next: Next) => {
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
    accessToken: (() => {
      const token = process.env.POLAR_ACCESS_TOKEN;
      if (!token) throw new Error('POLAR_ACCESS_TOKEN environment variable is required');
      return token;
    })(),
    successUrl: `${process.env.PUBLIC_ORIGIN || 'http://localhost:8080'}/success`,
    server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    theme: 'dark',
  })
);

// Get subscription status with proper authorization
app.get('/subscription', authenticateUser, async (c: Context<AppEnv>) => {
  try {
    const user = c.get('user');
    const polar = getPolarClient();
    
    // Create customer mapping helper function
    const getUserCustomerId = async (userId: string, email?: string): Promise<string | null> => {
      try {
        // First try to find existing customer by metadata
        const customers = await polar.customers.list({
          email: email || undefined,
          limit: 10
        });
        
        // Handle response structure - customers might be direct array or wrapped in data property
        type CustomerResponse = {
          id: string;
          metadata?: { userId?: string };
          email?: string;
        };
        
        const customerList: CustomerResponse[] = Array.isArray(customers) 
          ? customers 
          : (customers as { data?: CustomerResponse[] })?.data || [];
          
        const existingCustomer = customerList.find((customer: CustomerResponse) => 
          customer.metadata?.userId === userId || 
          (email && customer.email === email)
        );
        
        if (existingCustomer) {
          return existingCustomer.id;
        }
        
        return null;
      } catch (error) {
        console.error('Error finding customer:', error);
        return null;
      }
    };
    
    // Get customer ID for the authenticated user
    const customerId = await getUserCustomerId(user.id, user.email);
    
    if (!customerId) {
      // No customer found - return free plan
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
    
    // Get subscriptions for this specific customer only
    const subscriptions = await polar.subscriptions.list({
      customerId: customerId,
      limit: 10
    });
    
    // Handle response structure - subscriptions might be direct array or wrapped in data property
    type SubscriptionResponse = {
      status: string;
      customerId: string;
      metadata?: { planId?: string };
      currentPeriodStart: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd?: boolean;
    };
    
    const subscriptionList: SubscriptionResponse[] = Array.isArray(subscriptions) 
      ? subscriptions 
      : (subscriptions as { data?: SubscriptionResponse[] })?.data || [];
      
    // Find active subscription for this customer
    const activeSubscription = subscriptionList.find((sub: SubscriptionResponse) => 
      sub.status === 'active' && sub.customerId === customerId
    );
    
    // Double-check ownership - ensure the subscription belongs to the authenticated user
    if (activeSubscription && activeSubscription.customerId !== customerId) {
      console.error('Subscription ownership mismatch:', {
        subscriptionCustomerId: activeSubscription.customerId,
        expectedCustomerId: customerId,
        userId: user.id
      });
      return c.json({ error: 'Unauthorized access to subscription' }, 403);
    }
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
    
    // If unauthorized error, return 403
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return c.json({ error: 'Unauthorized access' }, 403);
    }
    
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
    accessToken: (() => {
      const token = process.env.POLAR_ACCESS_TOKEN;
      if (!token) throw new Error('POLAR_ACCESS_TOKEN environment variable is required');
      return token;
    })(),
    getCustomerId: async (event) => {
      // Extract customer ID from query params or user context
      const customerId = event.req.query('customerId');
      return customerId || '';
    },
    server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  })
);

// Polar.sh webhook handler using official Hono integration
app.post('/webhooks/polar', Webhooks({
  webhookSecret: (() => {
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (!secret) throw new Error('POLAR_WEBHOOK_SECRET environment variable is required');
    return secret;
  })(),
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
export const startServer = async (port = 3001) => {
  // Check for Bun runtime safely without TypeScript error
  const globalObj = globalThis as { Bun?: { serve: (config: { port: number; fetch: (request: Request) => Response | Promise<Response> }) => unknown } };
  const isBun = typeof globalObj.Bun !== 'undefined';
  
  if (isBun && globalObj.Bun) {
    // Running on Bun
    console.log(`🚀 Hono.js server starting on http://localhost:${port}`);
    return globalObj.Bun.serve({
      port,
      fetch: app.fetch,
    });
  } else {
    // Running on Node.js - skip for now as @hono/node-server is not available
    console.log(`🚀 Hono.js server would start on http://localhost:${port} (Node.js runtime not configured)`);
    return null;
  }
};

// Auto-start if this file is run directly
if (import.meta.main || (typeof module !== 'undefined' && require.main === module)) {
  startServer();
}