import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripeSubscriptionCache, findCustomerIdForUser } from './_utils/stripe';
import { getBearerOrSessionToken } from './_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method Not Allowed');
  }

  try {
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

    const customerId = await findCustomerIdForUser(authenticatedUserId);
    if (!customerId) {
      return res.status(200).json({ status: 'none' });
    }

    const sub = await getStripeSubscriptionCache(customerId);
    return res.status(200).json(sub);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).send(message);
  }
}


