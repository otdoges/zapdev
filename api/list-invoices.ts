import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './_utils/stripe';
import { kvGet } from './_utils/kv';
import { z } from 'zod';
import { getBearerOrSessionToken } from './_utils/auth';
import { KV_PREFIXES } from './_utils/kv-constants';

// token extraction centralized in ./_utils/auth

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const BodySchema = z.object({
      limit: z.coerce.number().int().optional(),
    });
    const parsed = BodySchema.safeParse(
      typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : req.body
    );
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const limitValue = Math.max(1, Math.min(24, parsed.data.limit ?? 12));

    const token = getBearerOrSessionToken(req);
    if (!token) return res.status(401).send('Unauthorized');
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) return res.status(500).send('Server misconfiguration');
    // @ts-expect-error runtime import OK in serverless
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

    const fetchedCustomerId = await kvGet(`${KV_PREFIXES.STRIPE_USER}${authenticatedUserId}`);
    if (!fetchedCustomerId) {
      return res.status(200).json({ invoices: [] });
    }
    const customerId = fetchedCustomerId;

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: limitValue,
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
    return res.status(500).send('Internal Server Error');
  }
}
