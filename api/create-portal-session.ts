import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './_utils/stripe';
import { kvGet } from './_utils/kv';

function getBearerOrSessionToken(req: VercelRequest): string | null {
  const authHeader = (Array.isArray(req.headers['authorization'])
    ? req.headers['authorization'][0]
    : req.headers['authorization']) as string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie as string | undefined;
  if (cookieHeader) {
    const tokenCookie = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('__session='));
    if (tokenCookie) {
      const val = tokenCookie.split('=')[1] || '';
      try {
        return decodeURIComponent(val);
      } catch {
        return val;
      }
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { customerId: providedCustomerId, returnUrl } = (req.body || {}) as {
      customerId?: string;
      returnUrl?: string;
    };

    const token = getBearerOrSessionToken(req);
    if (!token) return res.status(401).send('Unauthorized');
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) return res.status(500).send('Missing CLERK_JWT_ISSUER_DOMAIN');
    // @ts-expect-error Types may be unavailable in dev; runtime import is valid
    const { verifyToken } = await import('@clerk/backend');
    const verified = await verifyToken(token, { issuer });
    const authenticatedUserId = verified.sub;
    if (!authenticatedUserId) return res.status(401).send('Unauthorized');

    const xfHost = (Array.isArray(req.headers['x-forwarded-host'])
      ? req.headers['x-forwarded-host'][0]
      : req.headers['x-forwarded-host']) as string | undefined;
    const host = xfHost
      || (Array.isArray(req.headers['host'])
        ? req.headers['host'][0]
        : (req.headers['host'] as string | undefined));

    const xfProto = (Array.isArray(req.headers['x-forwarded-proto'])
      ? req.headers['x-forwarded-proto'][0]
      : req.headers['x-forwarded-proto']) as string | undefined;

    const origin = host
      ? `${xfProto || 'https'}://${host}`
      : (process.env.PUBLIC_ORIGIN || 'https://zapdev.link');

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

    // Determine customerId with ownership enforcement
    const storedCustomerId = await kvGet(`stripe:user:${authenticatedUserId}`);
    const customerId = (providedCustomerId && storedCustomerId && providedCustomerId === storedCustomerId)
      ? providedCustomerId
      : storedCustomerId;
    if (!customerId) {
      return res.status(404).send('No Stripe customer found for user');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: safeReturn,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).send(message);
  }
}

 
