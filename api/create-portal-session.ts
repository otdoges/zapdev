import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './_utils/stripe';
import { kvGet } from './_utils/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { userId, customerId: providedCustomerId, returnUrl } = (req.body || {}) as {
      userId?: string;
      customerId?: string;
      returnUrl?: string;
    };

    const xfHost = (Array.isArray(req.headers['x-forwarded-host'])
      ? req.headers['x-forwarded-host'][0]
      : req.headers['x-forwarded-host']) as string | undefined;
    const host = xfHost
      || (Array.isArray(req.headers['host'])
        ? req.headers['host'][0]
        : (req.headers['host'] as string | undefined));

    const xfProto = (Array.isArray(req.headers['x-forwarded-proto'])
      ? req.headers['x-forwarded-proto'][0]
      : req.headers['x-forwarded-proto']) as string | undefined;

    const origin = host
      ? `${xfProto || 'https'}://${host}`
      : (process.env.PUBLIC_ORIGIN || 'https://zapdev.link');

    let safeReturn = `${origin}/settings`;
    if (returnUrl) {
      try {
        const u = new URL(returnUrl, origin);
        if (u.origin === origin) {
          safeReturn = u.toString();
        }
      } catch {
        // ignore invalid URL, keep default
      }
    }

    if (!userId) {
      return res.status(400).send('Missing userId');
    }

    // Derive customerId from KV if not explicitly provided
    const customerId = providedCustomerId || (await kvGet(`stripe:user:${userId}`));
    if (!customerId) {
      return res.status(404).send('No Stripe customer found for user');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: safeReturn,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).send(message);
  }
}

 
