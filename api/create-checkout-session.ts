import { getBearerOrSessionToken } from './_utils/auth';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkToken, type VerifiedClerkToken } from './_utils/auth';
import { z } from 'zod';
import Stripe from 'stripe';
import { ensureStripeCustomer } from './_utils/stripe';

function withCors(res: VercelResponse, allowOrigin?: string) {
  const origin = allowOrigin ?? process.env.PUBLIC_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  return res;
}

function resolveOriginFromRequest(req: VercelRequest): string | undefined {
  const hdrOrigin = (req.headers?.origin as string | undefined)?.trim();
  if (hdrOrigin) return hdrOrigin;
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https';
  const host = (req.headers['x-forwarded-host'] as string | undefined) || (req.headers.host as string | undefined);
  if (host) return `${proto}://${host}`;
  return undefined;
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

  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    withCors(res, allowedOrigin);
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET, OPTIONS, HEAD');
    return withCors(res, allowedOrigin).status(405).send('Method Not Allowed');
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

    // Validate request body with Zod (support POST body and GET query fallback)
    const BodySchema = z.object({
      planId: z.string(),
      period: z.enum(['month', 'year']),
    });

    const rawBody = typeof req.body === 'string'
      ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })()
      : req.body;

    let sourceData: unknown = rawBody;
    if (req.method === 'GET') {
      const q = req.query as Record<string, string | string[] | undefined>;
      const planId = Array.isArray(q?.planId) ? q.planId[0] : (q?.planId ?? '');
      const period = Array.isArray(q?.period) ? q.period[0] : (q?.period ?? 'month');
      sourceData = { planId: String(planId), period: String(period) };
    }

    const parsed = BodySchema.safeParse(sourceData);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      console.error('Invalid request body for checkout:', details);
      return withCors(res, allowedOrigin).status(400).json({ error: 'Invalid request body', details });
    }

    const { planId, period } = parsed.data;
    console.log('Creating Stripe checkout for plan:', planId, 'period:', period);

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const envOrigin = process.env.PUBLIC_ORIGIN;
    const inferredOrigin = resolveOriginFromRequest(req);
    const origin = envOrigin || inferredOrigin;
    if (!stripeSecret || !origin) {
      return withCors(res, allowedOrigin).status(500).json({ error: 'Server misconfiguration' });
    }
    if (planId === 'free') {
      return withCors(res, allowedOrigin).status(400).json({ error: 'Free plan does not require checkout' });
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
    return withCors(res, allowedOrigin).status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return withCors(res, allowedOrigin).status(500).json({ error: message });
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
