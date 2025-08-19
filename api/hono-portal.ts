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

// Create customer portal session
app.post('/portal', async (c) => {
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

    try {
      const polar = getPolarClient();
      
      // For Polar.sh, customer portal access is typically handled differently
      // than Stripe. You might need to:
      // 1. Redirect to Polar.sh dashboard
      // 2. Use Polar.sh's customer portal if available
      // 3. Build your own subscription management interface
      
      // Option 1: Direct redirect to Polar.sh dashboard
      const portalUrl = process.env.NODE_ENV === 'production' 
        ? 'https://polar.sh/dashboard/subscriptions'
        : 'https://sandbox.polar.sh/dashboard/subscriptions';
      
      // Option 2: If Polar.sh has a customer portal API (check their docs)
      // const portalSession = await polar.customerPortal.create({
      //   customerId: customerIdFromYourDatabase,
      //   returnUrl: `${process.env.PUBLIC_ORIGIN}/settings`
      // });
      
      return c.json({
        url: portalUrl
      });
      
    } catch (polarError) {
      console.error('Polar.sh portal error:', polarError);
      
      // Fallback: redirect to your own billing settings page
      const fallbackUrl = `${process.env.PUBLIC_ORIGIN || 'http://localhost:8080'}/settings?tab=billing`;
      
      return c.json({
        url: fallbackUrl,
        message: 'Redirecting to billing settings. Contact support for subscription changes.'
      });
    }

  } catch (error) {
    console.error('Create portal session error:', error);
    return c.json({
      error: 'Portal Error',
      message: error instanceof Error ? error.message : 'Failed to create portal session'
    }, 500);
  }
});

// Handle OPTIONS for CORS
app.options('/portal', (c) => {
  return c.text('', 204);
});

// Export the Vercel handler
export default handle(app);