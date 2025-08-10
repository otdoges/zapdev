import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserSubscriptionFromPolar } from './_utils/polar';
import { getBearerOrSessionToken, verifyClerkToken, type VerifiedClerkToken } from './_utils/auth';

function freePlan() {
  const now = Date.now();
  return {
    planId: 'free' as const,
    status: 'none' as const,
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

    let authenticatedUserId: string | undefined;
    let email: string | undefined;
    
    if (token && issuer) {
      try {
        const audience = process.env.CLERK_JWT_AUDIENCE;
        const verified = await verifyClerkToken(token, issuer, audience);
        authenticatedUserId = verified?.sub;
        email = verified?.email as string | undefined;
        console.log('Token verified for user:', authenticatedUserId, 'email:', email);
      } catch (error) {
        console.error('Token verification failed:', error);
        // Continue without user context - fallback to free plan
      }
    } else {
      console.log('Missing token or issuer:', { hasToken: !!token, hasIssuer: !!issuer });
    }

    if (!authenticatedUserId) {
      console.log('No authenticated user, returning free plan');
      return res.status(200).json(freePlan());
    }

    console.log('Fetching subscription for user:', authenticatedUserId);
    const sub = await getUserSubscriptionFromPolar(authenticatedUserId, email);
    return res.status(200).json(sub);
  } catch (err) {
    console.error('get-subscription error', err);
    // Always return 200 with free plan as fallback to prevent frontend errors
    return res.status(200).json(freePlan());
  }
}


