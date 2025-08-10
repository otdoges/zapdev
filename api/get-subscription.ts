import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';
import Stripe from 'stripe';
import { ensureStripeCustomer, mapPriceId } from './_utils/stripe';

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
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method Not Allowed');
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
      return res.status(200).json(freePlan());
    }

    console.log('Fetching Stripe subscription for user:', authenticatedUserId);
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return res.status(200).json(freePlan());
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
    if (!email) {
      console.error('Missing email for authenticated user when fetching subscription', { authenticatedUserId });
      return res.status(200).json(freePlan());
    }
    const customerId = await ensureStripeCustomer(stripe, email, authenticatedUserId);
    if (!customerId) return res.status(200).json(freePlan());
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
    const sub = subs.data.find((s) => s.status === 'active' || s.status === 'trialing') || subs.data[0];
    if (!sub) return res.status(200).json(freePlan());
    const priceId = sub.items.data[0]?.price?.id || '';
    const planId = mapPriceId(priceId);
    return res.status(200).json({
      planId,
      status: sub.status,
      currentPeriodStart: (sub.current_period_start || 0) * 1000,
      currentPeriodEnd: (sub.current_period_end || 0) * 1000,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    });
  } catch (err) {
    console.error('get-subscription error', err);
    // Always return 200 with free plan as fallback to prevent frontend errors
    return res.status(200).json(freePlan());
  }
}
