import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';
import Stripe from 'stripe';

function withCors(res: VercelResponse, allowOrigin?: string) {
  const origin = allowOrigin ?? process.env.PUBLIC_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'private, no-store');
  return res;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS for both www and non-www domains
  const requestOrigin = req.headers.origin as string | undefined;
  let allowedOrigin = process.env.PUBLIC_ORIGIN ?? '*';
  
  if (requestOrigin) {
    // Allow both www and non-www versions of zapdev.link
    const isZapDevDomain = requestOrigin.includes('zapdev.link') || 
                          requestOrigin.includes('localhost') || 
                          requestOrigin.includes('127.0.0.1');
    
    if (isZapDevDomain) {
      allowedOrigin = requestOrigin;
    }
  }

  if (req.method === 'OPTIONS') {
    withCors(res, allowedOrigin);
    return res.status(204).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return withCors(res, allowedOrigin).status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only GET requests are allowed' 
    });
  }

  try {
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
        console.log('Token verified for user:', authenticatedUserId, 'email:', userEmail);
      } catch (error) {
        console.error('Token verification failed:', error);
        return withCors(res, allowedOrigin).status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required' 
        });
      }
    } else {
      console.log('Missing token or issuer:', { hasToken: !!token, hasIssuer: !!issuer });
      return withCors(res, allowedOrigin).status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    if (!authenticatedUserId) {
      return withCors(res, allowedOrigin).status(401).json({ 
        error: 'Unauthorized',
        message: 'User ID not found in token' 
      });
    }

    try {
      // Initialize Stripe
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY environment variable is not set');
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-07-30.basil',
      });

      // Find the Stripe customer by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length === 0) {
        // No customer found, return free plan
        const freeSubscriptionData = {
          planId: 'free',
          status: 'none',
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        };
        return withCors(res, allowedOrigin).status(200).json(freeSubscriptionData);
      }

      const customer = existingCustomers.data[0];
      console.log('Found Stripe customer:', customer.id);

      // Get active subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        // No active subscription, return free plan
        const freeSubscriptionData = {
          planId: 'free',
          status: 'none',
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        };
        return withCors(res, allowedOrigin).status(200).json(freeSubscriptionData);
      }

      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price.id;

      // Map Stripe price IDs back to plan IDs
      const planIdMap: Record<string, string> = {
        [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly']: 'pro',
        [process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly']: 'pro',
        [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly']: 'enterprise',
        [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly']: 'enterprise',
        [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly']: 'starter',
        [process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly']: 'starter',
      };

      const planId = planIdMap[priceId] || 'free';

      const subscriptionData = {
        planId: planId,
        status: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start * 1000, // Convert to milliseconds
        currentPeriodEnd: (subscription as any).current_period_end * 1000, // Convert to milliseconds
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
      };

      console.log('Retrieved subscription data for user:', authenticatedUserId, 'plan:', planId);
      return withCors(res, allowedOrigin).status(200).json(subscriptionData);

    } catch (stripeError) {
      console.error('Error fetching Stripe subscription:', stripeError);

      // Fallback to default subscription data if Stripe API fails
      const fallbackData = {
        planId: 'free',
        status: 'none',
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      };

      return withCors(res, allowedOrigin).status(200).json(fallbackData);
    }

  } catch (error) {
    console.error('Get subscription API error:', error);
    return withCors(res, allowedOrigin).status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}
