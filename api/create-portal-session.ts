import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken, type VerifiedClerkToken } from './_utils/auth';
import Stripe from 'stripe';
import { ensureStripeCustomer } from './_utils/stripe';

function withCors(res: VercelResponse, allowOrigin?: string) {
  const origin = allowOrigin ?? process.env.PUBLIC_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Cache-Control', 'private, no-store');
  return res;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    withCors(res);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET, OPTIONS, HEAD');
    return withCors(res).status(405).send('Method Not Allowed');
  }

  try {
    // Parse body safely
    const rawBody = req.body;
    let body: { customerId?: string; returnUrl?: string } = {};
    if (typeof rawBody === 'string') {
      try { body = JSON.parse(rawBody); } catch { body = {}; }
    } else if (rawBody && typeof rawBody === 'object') {
      body = rawBody as typeof body;
    }
    const { customerId: providedCustomerId, returnUrl } = body;

    // Token is optional; verify when available
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    let verified: VerifiedClerkToken | undefined;
    if (token && issuer) {
      try {
        const audience = process.env.CLERK_JWT_AUDIENCE;
        verified = await verifyClerkToken(token, issuer, audience);
      } catch {
        // ignore token errors for portal link generation
      }
    }

    const origin = process.env.PUBLIC_ORIGIN || 'https://zapdev.link';
    let safeReturn = `${origin}/settings`;
    if (returnUrl) {
      try {
        const u = new URL(returnUrl, origin);
        if (u.origin === origin) {
          safeReturn = u.toString();
        }
      } catch {
        // ignore invalid URL, keep default
      }
    }
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) return withCors(res).status(500).send('Server misconfiguration');
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
    const customer = await ensureStripeCustomer(stripe, verified?.email as string | undefined, verified?.sub);
    if (!customer) return withCors(res).status(400).send('No customer');
    const session = await stripe.billingPortal.sessions.create({ customer, return_url: safeReturn });
    return withCors(res).status(200).json({ url: session.url });
  } catch (err) {
    console.error('Polar portal error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return withCors(res).status(500).send(message);
  }
}
