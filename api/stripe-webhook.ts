import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeSecret) return res.status(500).send('Server misconfiguration');

  const signature = Array.isArray(req.headers['stripe-signature']) ? req.headers['stripe-signature'][0] : (req.headers['stripe-signature'] as string | undefined);
  if (!signature) return res.status(400).send('Missing stripe-signature header');

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

  type ReqWithRaw = VercelRequest & { rawBody?: string | Buffer; body?: unknown } & { text?: () => Promise<string> };
  const r = req as ReqWithRaw;
  const raw =
    typeof r.rawBody === 'string' ? Buffer.from(r.rawBody) : Buffer.isBuffer(r.rawBody) ? r.rawBody : Buffer.isBuffer(r.body) ? r.body : typeof r.body === 'string' ? Buffer.from(r.body) : undefined;
  if (!raw) return res.status(400).send('Raw body required');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    return res.status(400).send(`Webhook Error: ${msg}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        let userId = (sub.metadata?.userId as string) || '';
        // Fallback: try to resolve userId from the Stripe customer metadata
        if (!userId && typeof sub.customer === 'string') {
          try {
            const customer = await stripe.customers.retrieve(sub.customer);
            if (customer && !('deleted' in customer)) {
              userId = (customer.metadata?.userId as string) || '';
            }
          } catch {
            // ignore lookup failures; we'll skip Convex update if no userId
          }
        }
        const priceId = sub.items.data[0]?.price?.id || '';
        const planId = mapPriceId(priceId);
        const status = mapStatus(sub.status);
        const currentPeriodStart = (sub.current_period_start || 0) * 1000;
        const currentPeriodEnd = (sub.current_period_end || 0) * 1000;

        const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
        if (convexUrl && userId) {
          const client = new ConvexHttpClient(convexUrl);
          await client.mutation(api.users.upsertUserSubscription, {
            userId,
            planId,
            status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: !!sub.cancel_at_period_end,
          });
        }
        break;
      }
      case 'checkout.session.completed':
      default:
        break;
    }
  } catch (e) {
    console.error('[STRIPE WEBHOOK] Handler error', e);
  }

  return res.status(200).json({ received: true });
}

function mapPriceId(id: string): 'free' | 'pro' | 'enterprise' {
  const pro = [process.env.STRIPE_PRICE_PRO_MONTH, process.env.STRIPE_PRICE_PRO_YEAR].filter(Boolean) as string[];
  const ent = [process.env.STRIPE_PRICE_ENTERPRISE_MONTH, process.env.STRIPE_PRICE_ENTERPRISE_YEAR].filter(Boolean) as string[];
  if (ent.includes(id)) return 'enterprise';
  if (pro.includes(id)) return 'pro';
  return 'free';
}

function mapStatus(status: Stripe.Subscription.Status): 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none' {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'incomplete':
    case 'past_due':
    case 'canceled':
      return status;
    default:
      return 'none';
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
