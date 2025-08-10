import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserSubscriptionFromPolar } from './_utils/polar';
import { getBearerOrSessionToken } from './_utils/auth';

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
    if (!token) return res.status(200).json(freePlan());

    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) return res.status(200).json(freePlan());

    const { verifyToken } = await import('@clerk/backend');
    let verified: { sub?: string; email?: string } | undefined;
    try {
      const audience = process.env.CLERK_JWT_AUDIENCE;
      const options: { jwtKey?: string; audience?: string } = { jwtKey: issuer };
      if (audience) options.audience = audience;
      verified = (await verifyToken(token, options)) as unknown as { sub?: string; email?: string };
    } catch {
      return res.status(200).json(freePlan());
    }

    const authenticatedUserId = verified?.sub;
    if (!authenticatedUserId) return res.status(200).json(freePlan());

    const sub = await getUserSubscriptionFromPolar(authenticatedUserId, verified?.email as string | undefined);
    return res.status(200).json(sub);
  } catch (err) {
    console.error('get-subscription error', err);
    return res.status(200).json(freePlan());
  }
}


