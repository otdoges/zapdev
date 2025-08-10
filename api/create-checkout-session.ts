import { resolveCheckoutUrl } from './_utils/polar';
import { getBearerOrSessionToken } from './_utils/auth';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkToken, type VerifiedClerkToken } from './_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // Authenticate the user
    const token = getBearerOrSessionToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) return res.status(500).json({ error: 'Authentication not configured' });

    let verified: VerifiedClerkToken | undefined;
    try {
      const audience = process.env.CLERK_JWT_AUDIENCE;
      verified = await verifyClerkToken(token, issuer, audience);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const authenticatedUserId = verified?.sub;
    if (!authenticatedUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { planId, period } = (req.body || {}) as {
      planId?: string;
      period?: 'month' | 'year';
    };
    if (!planId) return res.status(400).json({ error: 'Missing planId' });

    // Check if Polar is configured
    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!polarAccessToken) {
      console.error('POLAR_ACCESS_TOKEN not configured');
      return res.status(400).json({ error: 'Billing not configured. Please contact support.' });
    }

    // Use authenticated user's ID and email
    const url = resolveCheckoutUrl(planId, period || 'month', { 
      userId: authenticatedUserId, 
      email: verified?.email 
    });
    if (!url || url === '#/billing') {
      console.error(`No checkout URL configured for plan ${planId} period ${period}`);
      return res.status(400).json({ error: 'Checkout not configured for this plan' });
    }
    return res.status(200).json({ url });
  } catch (err) {
    console.error('Checkout error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}


