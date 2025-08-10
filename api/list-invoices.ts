import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getBearerOrSessionToken } from './_utils/auth';
import Stripe from 'stripe';
import { ensureStripeCustomerByUser } from './_utils/stripe';

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
    const { verifyToken } = await import('@clerk/backend');
    let verified;
    try {
      const audience = process.env.CLERK_JWT_AUDIENCE;
      const options: { jwtKey?: string; audience?: string } = { jwtKey: issuer };
      if (audience) options.audience = audience;
      verified = await verifyToken(token, options);
    } catch {
      return res.status(401).send('Unauthorized');
    }
    const authenticatedUserId = verified.sub;
    if (!authenticatedUserId) return res.status(401).send('Unauthorized');

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) return res.status(500).json({ error: 'Stripe configuration missing' });
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
    const customer = await ensureStripeCustomerByUser(stripe, authenticatedUserId);
    if (!customer) return res.status(200).json({ invoices: [] });
    const invs = await stripe.invoices.list({ customer, limit: limitValue });
    return res.status(200).json({
      invoices: invs.data.map(i => ({
        id: i.id,
        amount_paid: i.amount_paid,
        currency: i.currency,
        hosted_invoice_url: i.hosted_invoice_url,
        invoice_pdf: i.invoice_pdf,
        period_start: i.period_start ? i.period_start * 1000 : null,
        period_end: i.period_end ? i.period_end * 1000 : null,
      })),
    });
  } catch (err) {
    console.error('List invoices error', err);
    return res.status(500).send('Internal Server Error');
  }
}
