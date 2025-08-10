import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './_utils/stripe';
import { kvGet, kvPutJson } from './_utils/kv';
import { getBearerOrSessionToken } from './_utils/auth';
import { KV_PREFIXES } from './_utils/kv-constants';

// token extraction centralized in ./_utils/auth

async function syncStripeDataToKV(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: 'all',
    expand: ['data.default_payment_method'],
  });

  if (subscriptions.data.length === 0) {
    await kvPutJson(`stripe:customer:${customerId}`, { status: 'none' });
    return { status: 'none' };
  }

  const subscription = subscriptions.data[0];
  const data = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price?.id ?? null,
    currentPeriodStart: subscription.current_period_start ?? null,
    currentPeriodEnd: subscription.current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    paymentMethod:
      subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null,
          }
        : null,
  };
  await kvPutJson(`stripe:customer:${customerId}`, data);
  return data;
}

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
    // @ts-expect-error Runtime import for serverless
    const { verifyToken } = await import('@clerk/backend');
    let verified;
    try {
      const audience = process.env.CLERK_JWT_AUDIENCE;
      const options: Record<string, unknown> = { issuer };
      if (audience) options.audience = audience;
      verified = await verifyToken(token, options as any);
    } catch {
      return res.status(401).send('Unauthorized');
    }
    const authenticatedUserId = verified.sub;
    if (!authenticatedUserId) return res.status(401).send('Unauthorized');

    const customerId = await kvGet(`${KV_PREFIXES.STRIPE_USER}${authenticatedUserId}`);
    if (!customerId) {
      return res.status(303).setHeader('Location', '/').send('');
    }
    await syncStripeDataToKV(customerId);
    return res.status(303).setHeader('Location', '/').send('');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[SUCCESS] sync error', message);
    return res.status(500).send('Internal Server Error');
  }
}


