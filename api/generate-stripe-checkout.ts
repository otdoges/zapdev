import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken, type VerifiedClerkToken } from './_utils/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { z } from 'zod';
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
    // REQUIRE authenticated user for checkout
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

    if (!token || !issuer) {
      console.error('[GENERATE_CHECKOUT] Missing token or issuer');
      return withCors(res, allowedOrigin).status(401).json({ 
        error: 'Authentication required. Please sign in to continue.',
        redirectToLogin: true,
      });
    }

    let verified: VerifiedClerkToken;
    try {
      const audience = process.env.CLERK_JWT_AUDIENCE;
      verified = await verifyClerkToken(token, issuer, audience);
      if (!verified?.sub || !verified?.email) {
        throw new Error('Invalid token payload');
      }
    } catch (error) {
      console.error('[GENERATE_CHECKOUT] Token verification failed:', error);
      return withCors(res, allowedOrigin).status(401).json({ 
        error: 'Invalid authentication. Please sign in again.',
        redirectToLogin: true,
      });
    }

    // Validate request body with Zod (support POST body and GET query fallback)
    const BodySchema = z.object({
      planId: z.enum(['pro', 'enterprise']),
      period: z.enum(['month', 'year']).default('month'),
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
      console.error('[GENERATE_CHECKOUT] Invalid request body:', details);
      return withCors(res, allowedOrigin).status(400).json({ 
        error: 'Invalid plan or billing period',
        details: details.fieldErrors,
      });
    }

    const { planId, period } = parsed.data;
    console.log('[GENERATE_CHECKOUT] Creating checkout for user:', verified.sub, 'plan:', planId, 'period:', period);

    // Initialize required services
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
    const envOrigin = process.env.PUBLIC_ORIGIN;
    const inferredOrigin = resolveOriginFromRequest(req);
    const origin = envOrigin || inferredOrigin;

    if (!stripeSecret || !convexUrl || !origin) {
      console.error('[GENERATE_CHECKOUT] Missing required environment variables');
      return withCors(res, allowedOrigin).status(500).json({ 
        error: 'Server configuration error. Please try again later.',
      });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
    const client = new ConvexHttpClient(convexUrl);

    // STEP 1: Ensure Stripe customer exists BEFORE creating checkout
    console.log('[GENERATE_CHECKOUT] Ensuring Stripe customer exists for user:', verified.sub);
    const { stripeCustomerId } = await client.mutation(api.users.ensureStripeCustomer, {
      userId: verified.sub,
      email: verified.email as string,
    });

    console.log('[GENERATE_CHECKOUT] Stripe customer ensured:', stripeCustomerId);

    // STEP 2: Resolve price ID
    const priceId = resolvePlanPriceId(planId, period);

    // STEP 3: Create checkout session with existing customer
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId, // ALWAYS use existing customer
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&checkout=success`,
      cancel_url: `${origin}/pricing?canceled=true`,
      client_reference_id: verified.sub,
      subscription_data: { 
        metadata: { 
          userId: verified.sub,
          planId,
          period,
        } 
      },
      metadata: { 
        userId: verified.sub,
        planId,
        period,
      },
      // Prefill customer info for better UX
      customer_update: {
        name: 'auto',
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Set billing address collection
      billing_address_collection: 'required',
    });

    console.log('[GENERATE_CHECKOUT] Checkout session created:', session.id, 'for user:', verified.sub);

    return withCors(res, allowedOrigin).status(200).json({ 
      url: session.url,
      sessionId: session.id,
      customerId: stripeCustomerId,
    });

  } catch (err) {
    console.error('[GENERATE_CHECKOUT] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    
    // Return user-friendly error messages
    let userMessage = 'Failed to create checkout session. Please try again.';
    if (message.includes('No such price')) {
      userMessage = 'Invalid pricing plan. Please refresh the page and try again.';
    } else if (message.includes('Customer')) {
      userMessage = 'Unable to process your request. Please ensure you are logged in and try again.';
    }
    
    return withCors(res, allowedOrigin).status(500).json({ 
      error: userMessage,
      technical: message, // Include technical details for debugging
    });
  }
}

function resolvePlanPriceId(planId: 'pro' | 'enterprise', period: 'month' | 'year'): string {
  const key = planId === 'pro'
    ? period === 'month' ? 'STRIPE_PRICE_PRO_MONTH' : 'STRIPE_PRICE_PRO_YEAR'
    : period === 'month' ? 'STRIPE_PRICE_ENTERPRISE_MONTH' : 'STRIPE_PRICE_ENTERPRISE_YEAR';
  
  const id = process.env[key];
  if (!id) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return id;
}