import { stripe } from './_utils/stripe';
import { kvGet, kvPut } from './_utils/kv';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Basic map from planId to Stripe Price ID(s)
const PLAN_TO_PRICE: Record<string, { month: string; year?: string }> = {
  pro: {
    month: process.env.STRIPE_PRICE_PRO_MONTH || '',
    year: process.env.STRIPE_PRICE_PRO_YEAR || '',
  },
  enterprise: {
    month: process.env.STRIPE_PRICE_ENTERPRISE_MONTH || '',
    year: process.env.STRIPE_PRICE_ENTERPRISE_YEAR || '',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { planId, period, userId, email } = (req.body || {}) as {
      planId?: string;
      period?: 'month' | 'year';
      userId?: string;
      email?: string;
    };
    if (!planId) return res.status(400).send('Missing planId');
    if (!userId) return res.status(400).send('Missing userId');

    const mapping = PLAN_TO_PRICE[planId];
    if (!mapping) return res.status(400).send('Unknown planId');

    const priceId = (period === 'year' ? mapping.year : mapping.month) || mapping.month;
    if (!priceId) return res.status(400).send('No Stripe price configured for this plan');

    const origin = process.env.PUBLIC_ORIGIN || 'https://zapdev.link';

    // Ensure Stripe customer exists and bind to user in KV
    const kvKey = `stripe:user:${userId}`;
    let stripeCustomerId = await kvGet(kvKey);
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: { userId },
      });
      await kvPut(kvKey, customer.id);
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      success_url: `${origin}/success`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).send(message);
  }
}


