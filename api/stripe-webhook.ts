import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { stripe } from './_utils/stripe';
import { kvPutJson } from './_utils/kv';

// Allowed events that can affect subscription state
const allowedEvents: string[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.upcoming',
  'invoice.marked_uncollectible',
  'invoice.payment_succeeded',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
];

export type StripeSubCache =
  | {
      subscriptionId: string | null;
      status: Stripe.Subscription.Status;
      priceId: string | null;
      currentPeriodStart: number | null;
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null;
        last4: string | null;
      } | null;
    }
  | {
      status: 'none';
    };

async function syncStripeDataToKV(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    // Fetch more than one to avoid caching a stale/cancelled sub
    limit: 100,
    status: 'all',
    expand: ['data.default_payment_method'],
  });

  const allSubs = subscriptions.data ?? [];

  // Prefer active or trialing subscriptions, most recent by current period start
  const candidates = allSubs
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .sort((a, b) => (b.current_period_start ?? 0) - (a.current_period_start ?? 0));

  const subscription = candidates[0];

  if (!subscription) {
    const subData: StripeSubCache = { status: 'none' };
    await kvPutJson(`stripe:customer:${customerId}`, subData);
    return subData;
  }

  const subData: StripeSubCache = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price?.id ?? null,
    currentPeriodStart: subscription.current_period_start ?? null,
    currentPeriodEnd: subscription.current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    paymentMethod:
      subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null,
          }
        : null,
  };

  await kvPutJson(`stripe:customer:${customerId}`, subData);
  return subData;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');
  }

  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!sig) return res.status(400).send('Missing stripe-signature header');

  const rawBody = (req as any).rawBody || (req.body && typeof req.body === 'string' ? req.body : undefined);
  // When deployed on Vercel, set functions config: { api: { bodyParser: false } }
  if (!rawBody) {
    // Vercel automatically provides rawBody when bodyParser is disabled
    // If unavailable, we can't verify the signature
    return res.status(400).send('Raw body required');
  }

  try {
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    if (allowedEvents.includes(event.type)) {
      const obj: any = event.data?.object ?? {};
      const customerId = obj.customer as string | undefined;
      if (customerId && typeof customerId === 'string') {
        await syncStripeDataToKV(customerId);
      }
    }

    return res.status(200).json({ received: true });
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