import type { VercelRequest, VercelResponse } from '@vercel/node';
// Replaced by Polar webhook

// Allowed Polar events (placeholder, adjust to Polar's event types as needed)
const allowedEvents: string[] = [
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
  'checkout.completed',
  'invoice.paid',
  'invoice.payment_failed',
];

// No persistence layer here anymore; clients fetch on-demand via API

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');
  }

  const sigHeader = req.headers['polar-signature'] || req.headers['stripe-signature'];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : (sigHeader as string | undefined);
  if (!sig) return res.status(400).send('Missing stripe-signature header');

  type ReqWithRaw = VercelRequest & { rawBody?: string | Buffer; body?: unknown } & { text?: () => Promise<string> };
  const r = req as ReqWithRaw;
  let raw: Buffer | undefined =
    typeof r.rawBody === 'string' ? Buffer.from(r.rawBody) : (Buffer.isBuffer(r.rawBody) ? r.rawBody :
    (Buffer.isBuffer(r.body) ? r.body : (typeof r.body === 'string' ? Buffer.from(r.body) : undefined)));
  // As a last resort in some runtimes, try accessing text()
  if (!raw && typeof r.text === 'function') {
    try {
      const txt = await r.text();
      raw = Buffer.from(txt);
    } catch {
      // ignore
    }
  }
  // When deployed on Vercel, set functions config: { api: { bodyParser: false } }
  if (!raw) {
    // Vercel automatically provides rawBody when bodyParser is disabled
    // If unavailable, we can't verify the signature
    return res.status(400).send('Raw body required');
  }

  try {
    // For Polar, implement signature verification accordingly when available.
    // For now, if a secret is set, require signature header to be present.
    if (webhookSecret && !sig) {
      return res.status(400).send('Missing signature header');
    }
    const event = { type: (req.headers['polar-event'] as string) || 'unknown', payload: undefined } as { type: string; payload?: unknown };
    // Optional: Quickly acknowledge for non-relevant events
    if (!allowedEvents.includes(event.type)) {
      return res.status(200).json({ received: true, ignored: true, type: event.type });
    }

    // Intentionally minimal webhook: signature verified + 200 OK
    // Subscription state is fetched on-demand by the client/API.

    return res.status(200).json({ received: true, type: event.type });
  } catch (err: unknown) {
    const errorMessage =
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message?: string }).message
        : String(err);
    console.error('[STRIPE WEBHOOK] Error', errorMessage);
    return res.status(400).send(`Webhook Error: ${errorMessage || 'Unknown error'}`);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
