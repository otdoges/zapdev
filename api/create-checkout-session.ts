import { getBearerOrSessionToken } from './_utils/auth';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkToken, type VerifiedClerkToken } from './_utils/auth';
import { z } from 'zod';
import Stripe from 'stripe';
import { ensureStripeCustomer } from './_utils/stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // Token is optional for checkout; we'll use it to prefill when available
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

    let verified: VerifiedClerkToken | undefined;
    if (token && issuer) {
      try {
        const audience = process.env.CLERK_JWT_AUDIENCE;
        verified = await verifyClerkToken(token, issuer, audience);
        console.log('Checkout session token verified for user:', verified?.sub);
      } catch (error) {
        console.error('Token verification failed in checkout:', error);
        // Continue without user context for checkout
      }
    } else {
      console.log('Missing token or issuer for checkout:', { hasToken: !!token, hasIssuer: !!issuer });
    }

    // Validate request body with Zod (Vercel may pass string)
    const BodySchema = z.object({
      planId: z.string(),
      period: z.enum(['month', 'year']),
    });

    const rawBody = typeof req.body === 'string'
      ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })()
      : req.body;

    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      console.error('Invalid request body for checkout:', details);
      return res.status(400).json({ error: 'Invalid request body', details });
    }

    const { planId, period } = parsed.data;
    console.log('Creating Stripe checkout for plan:', planId, 'period:', period);

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const origin = process.env.PUBLIC_ORIGIN;
    if (!stripeSecret || !origin) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    if (planId === 'free') {
      return res.status(400).json({ error: 'Free plan does not require checkout' });
    }

    const priceId = resolvePlanPriceId(planId as 'pro' | 'enterprise', period);
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

    const customer = await ensureStripeCustomer(stripe, verified?.email, verified?.sub);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      client_reference_id: verified?.sub,
      subscription_data: { metadata: { userId: verified?.sub || '' } },
      metadata: { userId: verified?.sub || '' },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}


function resolvePlanPriceId(planId: 'pro' | 'enterprise', period: 'month' | 'year'): string {
  const key = planId === 'pro'
    ? period === 'month' ? 'STRIPE_PRICE_PRO_MONTH' : 'STRIPE_PRICE_PRO_YEAR'
    : period === 'month' ? 'STRIPE_PRICE_ENTERPRISE_MONTH' : 'STRIPE_PRICE_ENTERPRISE_YEAR';
  const id = process.env[key];
  if (!id) throw new Error(`Missing ${key}`);
  return id;
}
