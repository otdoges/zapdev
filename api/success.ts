import type { VercelRequest, VercelResponse } from '@vercel/node';
// Stripe success redirect handler (no-op; webhook updates state)
import { getBearerOrSessionToken, type VerifiedClerkToken } from './_utils/auth';

function withCors(res: VercelResponse, allowOrigin?: string) {
  const origin = allowOrigin ?? process.env.PUBLIC_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  return res;
}

// token extraction centralized in ./_utils/auth

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

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET, OPTIONS');
    return withCors(res, allowedOrigin).status(405).send('Method Not Allowed');
  }

  try {
    // Enforce authenticated request; prefer Authorization header token
    const token = getBearerOrSessionToken(req);
    if (!token) return withCors(res, allowedOrigin).status(401).send('Unauthorized');
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) return withCors(res, allowedOrigin).status(500).send('Server misconfiguration');
    const { verifyToken } = await import('@clerk/backend');
    let verified: VerifiedClerkToken | undefined;
    try {
      const audience = process.env.CLERK_JWT_AUDIENCE;
      const options: { jwtKey?: string; audience?: string } = { jwtKey: issuer };
      if (audience) options.audience = audience;
      verified = await verifyToken(token, options);
    } catch {
      return withCors(res, allowedOrigin).status(401).send('Unauthorized');
    }
    const authenticatedUserId = verified.sub;
    if (!authenticatedUserId) return withCors(res, allowedOrigin).status(401).send('Unauthorized');

    // With Stripe Checkout, nothing to sync here; webhook updates state.
    if (req.method === 'GET') {
      return withCors(res, allowedOrigin).status(200).json({ ok: true });
    }
    return withCors(res, allowedOrigin).status(204).send('');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[SUCCESS] sync error', message);
    return withCors(res, allowedOrigin).status(500).send('Internal Server Error');
  }
}


