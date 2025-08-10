import { resolveCheckoutUrl } from './_utils/polar';
import { VercelRequest, VercelResponse } from '@vercel/node';

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

    const url = resolveCheckoutUrl(planId, period || 'month', { userId, email });
    if (!url || url === '#/billing') {
      return res.status(400).json({ error: 'Checkout not configured for this plan' });
    }
    return res.status(200).json({ url });
  } catch (err) {
    console.error('Checkout error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).send(message);
  }
}


