import { Webhooks } from '@polar-sh/nextjs';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function handleSubscription(subscription: any) {
  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      id: subscription.id,
      user_id: subscription.customer_id, // Assuming customer_id is the supabase user_id
      status: subscription.status,
      price_id: subscription.price.id,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start_at: subscription.current_period_start,
      current_period_end_at: subscription.current_period_end,
      ended_at: subscription.ended_at,
      cancel_at: subscription.cancel_at,
      canceled_at: subscription.canceled_at,
      trial_start_at: subscription.trial_start,
      trial_end_at: subscription.trial_end,
    });
}

async function handleProduct(product: any) {
  await supabaseAdmin
    .from('products')
    .upsert({
      id: product.id,
      active: product.is_archived ? false : true,
      name: product.name,
      description: product.description,
      image: product.image,
    });

  if (product.prices) {
    for (const price of product.prices) {
      await supabaseAdmin
        .from('prices')
        .upsert({
          id: price.id,
          product_id: product.id,
          active: price.is_archived ? false : true,
          unit_amount: price.price_amount,
          currency: price.price_currency,
          type: price.type,
          interval: price.recurring_interval,
        });
    }
  }
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    switch (payload.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscription(payload.data);
        break;
      case 'product.created':
      case 'product.updated':
        await handleProduct(payload.data);
        break;
      default:
        console.log(`Unhandled event type: ${payload.type}`);
    }
  },
});
