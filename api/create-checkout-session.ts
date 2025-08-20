import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const authHeader = (Array.isArray(req.headers['authorization']) ? req.headers['authorization'][0] : req.headers['authorization']) || '';
    const auth = await verifyAuth({ headers: new Headers({ Authorization: authHeader || '' }) });
    if (!auth.success || !auth.userId) {
      return res.status(401).json({ message: auth.error || 'Unauthorized' });
    }

    const { planId, period } = (typeof req.body === 'object' && req.body) ? req.body as Record<string, unknown> : JSON.parse(req.body || '{}');
    const billingPeriod: 'month' | 'year' = (period === 'year' ? 'year' : 'month');

    if (!planId) {
      return res.status(400).json({ message: 'planId is required' });
    }

    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ message: 'POLAR_ACCESS_TOKEN not configured' });
    }

    const productIdMap: Record<string, Record<string, string>> = {
      starter: {
        month: process.env.POLAR_PRODUCT_STARTER_MONTH_ID || '',
        year: process.env.POLAR_PRODUCT_STARTER_YEAR_ID || '',
      },
      pro: {
        month: process.env.POLAR_PRODUCT_PRO_MONTH_ID || '',
        year: process.env.POLAR_PRODUCT_PRO_YEAR_ID || '',
      },
      enterprise: {
        month: process.env.POLAR_PRODUCT_ENTERPRISE_MONTH_ID || '',
        year: process.env.POLAR_PRODUCT_ENTERPRISE_YEAR_ID || '',
      },
    };

    const planMap = productIdMap[planId as keyof typeof productIdMap];
    const productId = planMap?.[billingPeriod as keyof typeof planMap];
    if (!productId) {
      return res.status(400).json({ message: `Unsupported plan/period: ${planId}/${billingPeriod}` });
    }

    // Build URL for Hono adapter which performs the actual checkout via @polar-sh/hono
    const base = process.env.PUBLIC_ORIGIN || 'http://localhost:8080';
    const honoCheckout = new URL('/hono/checkout-polar', base);
    honoCheckout.searchParams.set('products', productId);
    // Customer email is optional; Clerk email not available in this handler without extra fetch
    honoCheckout.searchParams.set('metadata', JSON.stringify({ userId: auth.userId, planId, period: billingPeriod }));

    return res.status(200).json({ url: honoCheckout.toString() });
  } catch (error: unknown) {
    console.error('create-checkout-session error:', error);
    const err = error as { statusCode?: number; message?: string } | undefined;
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    return res.status(status).json({ message: err?.message || 'Internal Server Error' });
  }
}

export const config = {
  runtime: 'nodejs',
};


