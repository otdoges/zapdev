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
  if (!secret || !stripeSecret) {
    console.error('[STRIPE WEBHOOK] Missing configuration');
    return res.status(500).send('Server misconfiguration');
  }

  const signature = Array.isArray(req.headers['stripe-signature']) 
    ? req.headers['stripe-signature'][0] 
    : (req.headers['stripe-signature'] as string | undefined);
  
  if (!signature) {
    console.error('[STRIPE WEBHOOK] Missing stripe-signature header');
    return res.status(400).send('Missing stripe-signature header');
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

  // Get raw body for signature verification
  type ReqWithRaw = VercelRequest & { rawBody?: string | Buffer; body?: unknown } & { text?: () => Promise<string> };
  const r = req as ReqWithRaw;
  const raw = typeof r.rawBody === 'string' 
    ? Buffer.from(r.rawBody) 
    : Buffer.isBuffer(r.rawBody) 
    ? r.rawBody 
    : Buffer.isBuffer(r.body) 
    ? r.body 
    : typeof r.body === 'string' 
    ? Buffer.from(r.body) 
    : undefined;

  if (!raw) {
    console.error('[STRIPE WEBHOOK] Raw body required for signature verification');
    return res.status(400).send('Raw body required');
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
    console.log('[STRIPE WEBHOOK] Event verified:', event.type, 'id:', event.id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    console.error('[STRIPE WEBHOOK] Signature verification failed:', msg);
    return res.status(400).send(`Webhook Error: ${msg}`);
  }

  try {
    // Enhanced event handling using centralized sync function
    const allowedEvents = [
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

    if (!allowedEvents.includes(event.type)) {
      console.log('[STRIPE WEBHOOK] Ignoring event type:', event.type);
      return res.status(200).json({ received: true, ignored: true });
    }

    // Extract customer ID from different event types
    let customerId: string | undefined;
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        customerId = typeof session.customer === 'string' ? session.customer : undefined;
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
      case 'customer.subscription.pending_update_applied':
      case 'customer.subscription.pending_update_expired':
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        customerId = typeof subscription.customer === 'string' ? subscription.customer : undefined;
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'invoice.payment_action_required':
      case 'invoice.upcoming':
      case 'invoice.marked_uncollectible':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        customerId = typeof invoice.customer === 'string' ? invoice.customer : undefined;
        break;
      }
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        customerId = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : undefined;
        break;
      }
    }

    if (!customerId) {
      console.error('[STRIPE WEBHOOK] No customer ID found for event type:', event.type);
      return res.status(400).json({ error: 'No customer ID found in event' });
    }

    // Use our centralized sync function
    const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      console.error('[STRIPE WEBHOOK] Missing Convex URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const client = new ConvexHttpClient(convexUrl);
    
    console.log('[STRIPE WEBHOOK] Syncing data for event:', event.type, 'customer:', customerId);
    
    const syncResult = await client.mutation(api.users.syncStripeDataToConvex, {
      stripeCustomerId: customerId,
      source: 'webhook',
    });

    console.log('[STRIPE WEBHOOK] Successfully synced for customer:', customerId, 'user:', syncResult.userId, 'plan:', syncResult.planId, 'status:', syncResult.status);

    return res.status(200).json({ 
      received: true, 
      eventType: event.type,
      processed: true,
      userId: syncResult.userId,
      planId: syncResult.planId,
    });

  } catch (e) {
    console.error('[STRIPE WEBHOOK] Handler error for event:', event.type, 'error:', e);
    
    // For webhook errors, we should return 200 to prevent Stripe from retrying
    // But log the error for investigation
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error('[STRIPE WEBHOOK] Full error details:', {
      eventType: event.type,
      eventId: event.id,
      error: errorMessage,
      stack: e instanceof Error ? e.stack : undefined,
    });

    // Return success to Stripe to prevent retry, but indicate processing failed
    return res.status(200).json({ 
      received: true, 
      processed: false, 
      error: 'Processing failed - check logs',
      eventType: event.type,
    });
  }
}

// Vercel configuration for webhook handling
export const config = {
  api: {
    bodyParser: false,
  },
};