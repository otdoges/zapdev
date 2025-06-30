import { Webhooks } from '@polar-sh/nextjs';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function handleSubscription(subscription: Record<string, unknown>) {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not available - cannot process subscription webhook');
    return;
  }

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      id: subscription.id,
      user_id: (subscription as { customer_id?: string }).customer_id, // Assuming customer_id is the supabase user_id
      status: (subscription as { status?: string }).status,
      price_id: (subscription as { price?: { id?: string } }).price?.id,
      cancel_at_period_end: (subscription as { cancel_at_period_end?: boolean }).cancel_at_period_end,
      current_period_start_at: (subscription as { current_period_start?: string }).current_period_start,
      current_period_end_at: (subscription as { current_period_end?: string }).current_period_end,
      ended_at: (subscription as { ended_at?: string }).ended_at,
      cancel_at: (subscription as { cancel_at?: string }).cancel_at,
      canceled_at: (subscription as { canceled_at?: string }).canceled_at,
      trial_start_at: (subscription as { trial_start?: string }).trial_start,
      trial_end_at: (subscription as { trial_end?: string }).trial_end,
    });
}

async function handleProduct(product: Record<string, unknown>) {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not available - cannot process product webhook');
    return;
  }

  await supabaseAdmin
    .from('products')
    .upsert({
      id: product.id,
      active: (product as { is_archived?: boolean }).is_archived ? false : true,
      name: (product as { name?: string }).name,
      description: (product as { description?: string }).description,
      image: (product as { image?: string }).image,
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
