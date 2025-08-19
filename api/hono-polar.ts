import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { Checkout, CustomerPortal, Webhooks } from '@polar-sh/hono';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';

const app = new Hono();

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

// Customer portal using official Hono integration
app.get(
  '/portal',
  authenticateUser,
  CustomerPortal({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    getCustomerId: async (event) => {
      // Extract customer ID from query params or user context
      const customerId = event.req.query('customerId');
      return customerId || '';
    },
    server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  })
);

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

// Export the Vercel handler
export default handle(app);