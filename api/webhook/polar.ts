import type { VercelRequest, VercelResponse } from '@vercel/node';

// Polar webhook endpoint
// URL: /api/webhook/polar
// Docs reference: https://docs.polar.sh/llms-full.txt (Webhooks section)

const SUPPORTED_EVENTS = new Set<string>([
  'checkout.created',
  'checkout.updated',
  'order.created',
  'order.updated',
  'order.paid',
  'subscription.created',
  'subscription.updated',
  'subscription.active',
  'subscription.canceled',
  'subscription.revoked',
  'invoice.paid',
  'invoice.payment_failed',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    const signatureHeaderRaw = req.headers['polar-signature'] || req.headers['x-polar-signature'];
    const signature = Array.isArray(signatureHeaderRaw) ? signatureHeaderRaw[0] : signatureHeaderRaw;

    // Minimal verification: require secret and presence of signature header.
    // For full verification, prefer Polar SDK adapters (Next.js/Express/etc.).
    if (secret && !signature) {
      return res.status(400).send('Missing Polar signature header');
    }

    // Parse payload (supports string, buffer, or parsed JSON)
    type ReqWithRaw = VercelRequest & { rawBody?: string | Buffer; body?: unknown } & { text?: () => Promise<string> };
    const r = req as ReqWithRaw;
    let json: any = undefined;
    if (typeof r.body === 'object' && r.body !== null) {
      json = r.body;
    } else if (typeof r.body === 'string') {
      try { json = JSON.parse(r.body); } catch { /* ignore */ }
    } else if (typeof r.rawBody === 'string') {
      try { json = JSON.parse(r.rawBody); } catch { /* ignore */ }
    } else if (Buffer.isBuffer(r.rawBody)) {
      try { json = JSON.parse(r.rawBody.toString('utf8')); } catch { /* ignore */ }
    } else if (Buffer.isBuffer(r as unknown as Buffer)) {
      try { json = JSON.parse((r as unknown as Buffer).toString('utf8')); } catch { /* ignore */ }
    } else if (typeof r.text === 'function') {
      try { const txt = await r.text(); json = JSON.parse(txt); } catch { /* ignore */ }
    }

    const eventTypeHeaderRaw = req.headers['polar-event'] || req.headers['x-polar-event'];
    const eventTypeHeader = Array.isArray(eventTypeHeaderRaw) ? eventTypeHeaderRaw[0] : eventTypeHeaderRaw;
    const eventType = (eventTypeHeader as string) || (json && (json.type || json.event)) || 'unknown';

    // At this point you can branch on eventType and update your DB.
    // Our app fetches subscription state on-demand, so we just acknowledge.
    const ignored = !SUPPORTED_EVENTS.has(eventType);
    return res.status(200).json({ received: true, event: eventType, ignored });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[POLAR WEBHOOK] Error', message);
    return res.status(400).send(message);
  }
}


