import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

let stripe: Stripe;

export const getStripeClient = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }

    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

export async function syncStripeDataToSupabase(customerId: string) {
  const stripeClient = getStripeClient();
  const subscriptions = await stripeClient.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: 'all',
  });

  if (subscriptions.data.length === 0) {
    return;
  }

  const subscription = subscriptions.data[0];

  // Update user subscription data in Supabase
  const { error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      subscription_status: subscription.status,
      subscription_plan: subscription.items.data[0].price.id,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    errorLogger.error(
      ErrorCategory.GENERAL,
      'Error updating user subscription in Supabase:',
      error
    );
    throw error;
  }
}

export const allowedEvents: Stripe.Event.Type[] = [
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
