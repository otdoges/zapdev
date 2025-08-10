import { resolveCheckoutUrl } from './_utils/polar';
import { getBearerOrSessionToken } from './_utils/auth';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkToken, type VerifiedClerkToken } from './_utils/auth';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
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

    // Validate request body with Zod (Vercel may pass string)
    const BodySchema = z.object({
      planId: z.string(),
      period: z.enum(['month', 'year']),
    });

    const rawBody = typeof req.body === 'string'
      ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })()
      : req.body;

    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      console.error('Invalid request body for checkout:', details);
      return res.status(400).json({ error: 'Invalid request body', details });
    }

    const { planId, period } = parsed.data;
    console.log('Creating checkout session for plan:', planId, 'period:', period);

    const authenticatedUserId = verified?.sub;
    const authenticatedEmail = verified?.email as string | undefined;

    const url = resolveCheckoutUrl(planId, period, {
      userId: authenticatedUserId,
      email: authenticatedEmail,
    });
    
    if (!url || url === '#/billing') {
      console.error(`No checkout URL configured for plan ${planId} period ${period}`);
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('POLAR_CHECKOUT')));
      return res.status(400).json({ 
        error: 'Checkout not configured for this plan',
        plan: planId,
        period: period 
      });
    }
    
    console.log('Checkout URL resolved:', url);
    return res.status(200).json({ url });
  } catch (err) {
    console.error('Checkout error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}


