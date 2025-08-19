import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';
import { Polar } from '@polar-sh/sdk';
import { PLAN_FEATURES, getPlanDisplayName, type PlanType } from '../src/types/polar';

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

// Get subscription status
app.get('/subscription', async (c) => {
  try {
    // Get request details
    const req = c.req.raw as unknown as VercelRequest;
    
    // Get and verify Clerk authentication
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

    let authenticatedUserId: string | undefined;
    
    if (token && issuer) {
      try {
        const audience = process.env.CLERK_JWT_AUDIENCE;
        const verified = await verifyClerkToken(token, issuer, audience);
        authenticatedUserId = verified?.sub;
      } catch (error) {
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

    const polar = getPolarClient();
    
    // Get user's subscriptions from Polar.sh
    // Note: This is a simplified implementation. In production, you'd want to:
    // 1. Store customer ID mapping in your database
    // 2. Query subscriptions by customer ID
    // 3. Handle pagination and filtering properly
    
    try {
      const subscriptions = await polar.subscriptions.list({
        limit: 100 // Get recent subscriptions
      });
      
      // Find active subscription for this user
      const activeSubscription = subscriptions.items?.find(sub => 
        sub.status === 'active' && 
        sub.metadata?.userId === authenticatedUserId
      );
      
      if (!activeSubscription) {
        // Return free plan
        return c.json({
          planId: 'free' as PlanType,
          planName: 'Free',
          status: 'none' as const,
          features: PLAN_FEATURES.free,
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now(),
          cancelAtPeriodEnd: false,
        });
      }
      
      // Determine plan ID from subscription metadata or product info
      const planId = (activeSubscription.metadata?.planId as PlanType) || 'pro';
      
      return c.json({
        planId,
        planName: getPlanDisplayName(planId),
        status: activeSubscription.status,
        features: PLAN_FEATURES[planId] || PLAN_FEATURES.free,
        currentPeriodStart: new Date(activeSubscription.currentPeriodStart).getTime(),
        currentPeriodEnd: new Date(activeSubscription.currentPeriodEnd).getTime(),
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd || false,
      });
      
    } catch (polarError) {
      console.warn('Failed to fetch subscriptions from Polar.sh:', polarError);
      
      // Fallback to free plan if Polar.sh is unavailable
      return c.json({
        planId: 'free' as PlanType,
        planName: 'Free',
        status: 'none' as const,
        features: PLAN_FEATURES.free,
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now(),
        cancelAtPeriodEnd: false,
      });
    }

  } catch (error) {
    console.error('Get subscription error:', error);
    return c.json({
      planId: 'free' as PlanType,
      planName: 'Free',
      status: 'none' as const,
      features: PLAN_FEATURES.free,
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now(),
      cancelAtPeriodEnd: false,
    }, 500);
  }
});

// Handle OPTIONS for CORS
app.options('/subscription', (c) => {
  return c.text('', 204);
});

// Export the Vercel handler
export default handle(app);