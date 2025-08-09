import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './_utils/stripe';
import { kvGet, kvPutJson } from './_utils/kv';

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
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).send('Method Not Allowed');
  }

  const userIdFromQueryParam = req.query.userId;
  const userIdFromQuery = Array.isArray(userIdFromQueryParam)
    ? userIdFromQueryParam[0]
    : (userIdFromQueryParam as string | undefined);

  let userIdFromBody: string | undefined;
  if (req.body && typeof req.body === 'object') {
    const maybe = (req.body as { userId?: unknown }).userId;
    if (typeof maybe === 'string') userIdFromBody = maybe;
  }

  const userId = userIdFromQuery || userIdFromBody;
  if (!userId) return res.status(400).send('Missing userId');

  try {
    const customerId = await kvGet(`stripe:user:${userId}`);
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


