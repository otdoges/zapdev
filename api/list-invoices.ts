import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './_utils/stripe';
import { kvGet } from './_utils/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { userId, limit } = (req.body || {}) as {
      userId?: string;
      customerId?: string;
      limit?: number;
    };

    let customerId: string | undefined;

    if (!customerId) {
      if (!userId) return res.status(400).send('Missing userId or customerId');
      const fetchedCustomerId = await kvGet(`stripe:user:${userId}`);
      if (!fetchedCustomerId) return res.status(404).send('Stripe customer not found');
      customerId = fetchedCustomerId || undefined;
    }

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: Math.max(1, Math.min(24, Number(limit) || 12)),
    });

    const data = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number || null,
      status: inv.status,
      currency: inv.currency,
      amount_paid: inv.amount_paid,
      amount_due: inv.amount_due,
      created: inv.created,
      hosted_invoice_url: inv.hosted_invoice_url || null,
      invoice_pdf: inv.invoice_pdf || null,
      subscription: typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id || null,
      period_start: inv.lines?.data?.[0]?.period?.start ?? null,
      period_end: inv.lines?.data?.[0]?.period?.end ?? null,
    }));

    return res.status(200).json({ invoices: data });
  } catch (err) {
    console.error('Stripe list invoices error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).send(message);
  }
}
