import type { VercelRequest } from '@vercel/node';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';
import { Polar } from '@polar-sh/sdk';

const app = new Hono();

// Initialize Polar.sh SDK
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

// Checkout endpoint using Hono.js
app.post('/checkout', async (c) => {
  try {
    // Get request details
    const req = c.req.raw as unknown as VercelRequest;

    // Get and verify Clerk authentication
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

    let authenticatedUserId: string | undefined;
    let userEmail: string | undefined;
    
    if (token && issuer) {
      try {
        const audience = process.env.CLERK_JWT_AUDIENCE;
        const verified = await verifyClerkToken(token, issuer, audience);
        authenticatedUserId = verified?.sub;
        userEmail = verified?.email as string | undefined;
      } catch {
        return c.json({ 
          error: 'Unauthorized',
          message: 'Authentication required' 
        }, 401);
      }
    } else {
      return c.json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      }, 401);
    }

    if (!authenticatedUserId) {
      return c.json({ 
        error: 'Unauthorized',
        message: 'User ID not found in token' 
      }, 401);
    }

    // Parse request body
    const body = await c.req.json();
    const { planId, period = 'month' } = body;
    
    if (!planId) {
      return c.json({
        error: 'Bad Request',
        message: 'planId is required'
      }, 400);
    }

    if (planId === 'free') {
      return c.json({
        error: 'Bad Request',
        message: 'Free plan does not require checkout'
      }, 400);
    }

    if (planId === 'enterprise') {
      return c.json({
        error: 'Bad Request',
        message: 'Enterprise plan is not available for direct purchase. Please contact our sales team.',
        contactEmail: process.env.ENTERPRISE_CONTACT_EMAIL || 'enterprise@zapdev.link'
      }, 400);
    }

    const polar = getPolarClient();
    
    // Map plan IDs to Polar.sh product IDs
    const productIdMap: Record<string, Record<string, string>> = {
      'starter': {
        'month': process.env.POLAR_PRODUCT_STARTER_MONTH_ID || 'starter_monthly',
        'year': process.env.POLAR_PRODUCT_STARTER_YEAR_ID || 'starter_yearly',
      },
      'pro': {
        'month': process.env.POLAR_PRODUCT_PRO_MONTH_ID || 'pro_monthly',
        'year': process.env.POLAR_PRODUCT_PRO_YEAR_ID || 'pro_yearly',
      },
    };
    
    const planMap = productIdMap[planId as keyof typeof productIdMap];
    const productId = planMap?.[period as keyof typeof planMap];
    if (!productId) {
      return c.json({
        error: 'Invalid Plan',
        message: `Plan ${planId} with period ${period} is not supported`
      }, 400);
    }

    // Create checkout session
    const checkout = await polar.checkouts.create({
      products: [productId],
      customerBillingAddress: {
        country: 'US' // Default, can be customized based on user location
      },
      metadata: {
        userId: authenticatedUserId,
        planId,
        period,
      },
      successUrl: `${process.env.PUBLIC_ORIGIN || 'http://localhost:8080'}/success?session_id={CHECKOUT_SESSION_ID}`,
      customerEmail: userEmail,
    });
    
    return c.json({
      url: checkout.url,
      checkoutId: checkout.id,
      customerId: authenticatedUserId,
    });

  } catch (error) {
    console.error('Polar.sh checkout error:', error);
    return c.json({
      error: 'Checkout Error',
      message: error instanceof Error ? error.message : 'Failed to create checkout session'
    }, 500);
  }
});

// Handle OPTIONS for CORS
app.options('/checkout', () => {
  return new Response('', { status: 204 });
});

// Export the Vercel handler
export default handle(app);