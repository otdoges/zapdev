import type { VercelRequest, VercelResponse } from '@vercel/node';
// Polar success redirect handler (no-op except auth and redirect)
import { getBearerOrSessionToken } from './_utils/auth';

// token extraction centralized in ./_utils/auth

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // Enforce authenticated request; prefer Authorization header token
    const token = getBearerOrSessionToken(req);
    if (!token) return res.status(401).send('Unauthorized');
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) return res.status(500).send('Server misconfiguration');
    const { verifyToken } = await import('@clerk/backend');
    let verified;
    try {
      const audience = process.env.CLERK_JWT_AUDIENCE;
      const options: { jwtKey?: string; audience?: string } = { jwtKey: issuer };
      if (audience) options.audience = audience;
      verified = await verifyToken(token, options);
    } catch {
      return res.status(401).send('Unauthorized');
    }
    const authenticatedUserId = verified.sub;
    if (!authenticatedUserId) return res.status(401).send('Unauthorized');

    // With Polar hosted checkout, nothing to sync here (webhooks will update, or client fetches live)
    return res.status(303).setHeader('Location', '/').send('');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[SUCCESS] sync error', message);
    return res.status(500).send('Internal Server Error');
  }
}


