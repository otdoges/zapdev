import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { stripe } from './_utils/stripe';

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

// No persistence layer here anymore; clients fetch on-demand via API

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

  const rawBody = (req as VercelRequest & { rawBody?: string }).rawBody || (req.body && typeof req.body === 'string' ? req.body : undefined);
  // When deployed on Vercel, set functions config: { api: { bodyParser: false } }
  if (!rawBody) {
    // Vercel automatically provides rawBody when bodyParser is disabled
    // If unavailable, we can't verify the signature
    return res.status(400).send('Raw body required');
  }

  try {
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    // Intentionally minimal webhook: signature verified + 200 OK
    // Subscription state is fetched on-demand by the client/API.

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
