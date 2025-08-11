import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';
import Stripe from 'stripe';
import { ensureStripeCustomer, mapPriceId } from './_utils/stripe';

function withCors(res: VercelResponse, allowOrigin?: string) {
  const origin = allowOrigin ?? process.env.PUBLIC_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'private, no-store');
  return res;
}

function freePlan() {
  const now = Date.now();
  return {
    planId: 'free' as const,
    status: 'none' as const,
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
  };
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

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return withCors(res, allowedOrigin).status(405).send('Method Not Allowed');
  }

  try {
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

    let authenticatedUserId: string | undefined;
    let email: string | undefined;
    
    if (token && issuer) {
      try {
        const audience = process.env.CLERK_JWT_AUDIENCE;
        const verified = await verifyClerkToken(token, issuer, audience);
        authenticatedUserId = verified?.sub;
        email = verified?.email as string | undefined;
        console.log('Token verified for user:', authenticatedUserId, 'email:', email);
      } catch (error) {
        console.error('Token verification failed:', error);
        // Continue without user context - fallback to free plan
      }
    } else {
      console.log('Missing token or issuer:', { hasToken: !!token, hasIssuer: !!issuer });
    }

    if (!authenticatedUserId) {
      console.log('No authenticated user, returning free plan');
      return withCors(res, allowedOrigin).status(200).json(freePlan());
    }

    console.log('Fetching Stripe subscription for user:', authenticatedUserId);
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return withCors(res, allowedOrigin).status(200).json(freePlan());
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
    if (!email) {
      console.error('Missing email for authenticated user when fetching subscription', { authenticatedUserId });
      return withCors(res, allowedOrigin).status(200).json(freePlan());
    }
    const customerId = await ensureStripeCustomer(stripe, email, authenticatedUserId);
    if (!customerId) return withCors(res, allowedOrigin).status(200).json(freePlan());
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
    const sub = subs.data.find((s) => s.status === 'active' || s.status === 'trialing') || subs.data[0];
    if (!sub) return withCors(res, allowedOrigin).status(200).json(freePlan());
    const priceId = sub.items.data[0]?.price?.id || '';
    const planId = mapPriceId(priceId);
    return withCors(res, allowedOrigin).status(200).json({
      planId,
      status: sub.status,
      currentPeriodStart: (sub.current_period_start || 0) * 1000,
      currentPeriodEnd: (sub.current_period_end || 0) * 1000,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    });
  } catch (err) {
    console.error('get-subscription error', err);
    // Always return 200 with free plan as fallback to prevent frontend errors
    return withCors(res, allowedOrigin).status(200).json(freePlan());
  }
}
