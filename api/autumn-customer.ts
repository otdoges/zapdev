import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';

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
  const requestOrigin = req.headers.origin as string | undefined;
  let allowedOrigin = process.env.PUBLIC_ORIGIN ?? '*';
  if (requestOrigin) {
    const isZapDevDomain = requestOrigin.includes('zapdev.link') || requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1');
    if (isZapDevDomain) allowedOrigin = requestOrigin;
  }

  if (req.method === 'OPTIONS') {
    withCors(res, allowedOrigin);
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return withCors(res, allowedOrigin).status(405).json({ error: 'Method Not Allowed', message: 'Only GET requests are allowed' });
  }

  try {
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

    let authenticatedUserId: string | undefined;
    if (token && issuer) {
      try {
        const audience = process.env.CLERK_JWT_AUDIENCE;
        const verified = await verifyClerkToken(token, issuer, audience);
        authenticatedUserId = verified?.sub;
      } catch (error) {
        console.error('Token verification failed:', error);
        return withCors(res, allowedOrigin).status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      }
    } else {
      return withCors(res, allowedOrigin).status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (!authenticatedUserId) {
      return withCors(res, allowedOrigin).status(401).json({ error: 'Unauthorized', message: 'User ID not found in token' });
    }

    const autumnSecret = process.env.AUTUMN_SECRET_KEY;
    if (!autumnSecret) {
      return withCors(res, allowedOrigin).status(500).json({ error: 'Autumn Misconfigured', message: 'AUTUMN_SECRET_KEY is not set' });
    }

    const apiBase = process.env.AUTUMN_API_BASE || 'https://api.useautumn.com';

    const upstream = await fetch(`${apiBase}/v1/customers/${encodeURIComponent(authenticatedUserId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${autumnSecret}`,
      },
    });

    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error('Autumn customer fetch error:', upstream.status, payload);
      return withCors(res, allowedOrigin).status(upstream.status).json({ error: 'Customer Error', message: payload?.message || 'Failed to fetch Autumn customer', details: payload });
    }

    return withCors(res, allowedOrigin).status(200).json(payload?.data ?? payload);
  } catch (error) {
    console.error('Autumn customer API error:', error);
    return withCors(res, allowedOrigin).status(500).json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error occurred' });
  }
}