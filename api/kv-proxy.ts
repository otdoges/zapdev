// Back-compat: emulate old KV proxy using Stripe + Clerk-backed helpers
// Supports previous calls:
// - /api/kv-proxy?key=stripe:user:{userId}            → returns Stripe customerId as text
// - /api/kv-proxy?key=stripe:customer:{customerId}&json=1 → returns subscription JSON
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findCustomerIdForUser, getStripeSubscriptionCache } from './_utils/stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const keyParam = req.query.key as string | string[] | undefined;
    const jsonParam = req.query.json as string | string[] | undefined;
    const key = Array.isArray(keyParam) ? keyParam[0] : keyParam;
    const wantsJson = (Array.isArray(jsonParam) ? jsonParam[0] : jsonParam) === '1';
    if (!key) return res.status(400).send('Missing key');

    if (key.startsWith('stripe:user:')) {
      const userId = key.slice('stripe:user:'.length);
      if (!userId) return res.status(400).send('Invalid key');
      const customerId = await findCustomerIdForUser(userId);
      if (!customerId) return res.status(404).send('');
      return res.status(200).send(customerId);
    }

    if (key.startsWith('stripe:customer:')) {
      const customerId = key.slice('stripe:customer:'.length);
      if (!customerId) return res.status(400).send('Invalid key');
      const sub = await getStripeSubscriptionCache(customerId);
      if (wantsJson) return res.status(200).json(sub);
      // Legacy non-JSON was not used for subscription; return empty
      return res.status(404).send('');
    }

    // Public or unknown prefixes are not supported
    return res.status(403).send('Forbidden');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Error';
    return res.status(500).send(message);
  }
}


