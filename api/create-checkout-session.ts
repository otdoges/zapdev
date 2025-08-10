import { resolveCheckoutUrl } from './_utils/polar';
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

    // Return a Polar Checkout URL mapped via env
    const url = resolveCheckoutUrl(planId, period || 'month', { userId, email });
    return res.status(200).json({ url });
  } catch (err) {
    console.error('Stripe checkout error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).send(message);
  }
}


