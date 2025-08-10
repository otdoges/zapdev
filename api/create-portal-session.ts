import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolvePortalUrl } from './_utils/polar';
import { getBearerOrSessionToken, verifyClerkToken, type VerifiedClerkToken } from './_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
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

    const url = resolvePortalUrl(safeReturn);
    return res.status(200).json({ url });
  } catch (err) {
    console.error('Polar portal error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).send(message);
  }
}

 
