import { Webhooks } from '@polar-sh/nextjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

async function handleSubscription(subscription: any) {
  if (!supabaseAdmin) {
    errorLogger.error(ErrorCategory.API, 'Supabase admin client not available - cannot process subscription webhook');
    return;
  }

  try {
    // Find user by email since Polar uses email as external customer ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', subscription.customer_email)
      .single();

    if (userError || !user) {
      errorLogger.error(ErrorCategory.API, `User not found for email: ${subscription.customer_email}`, userError);
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        id: subscription.id,
        user_id: user.id,
        status: subscription.status,
        price_id: subscription.price?.id,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        current_period_start_at: subscription.current_period_start,
        current_period_end_at: subscription.current_period_end,
        ended_at: subscription.ended_at,
        cancel_at: subscription.cancel_at,
        canceled_at: subscription.canceled_at,
        trial_start_at: subscription.trial_start,
        trial_end_at: subscription.trial_end,
      })
      .select();

    if (error) {
      errorLogger.error(ErrorCategory.API, 'Failed to upsert subscription:', error);
    } else {
      errorLogger.info(ErrorCategory.API, `Successfully processed subscription ${subscription.id} for user ${user.id}`);
    }
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Error processing subscription webhook:', error);
  }
}

async function handleProduct(product: any) {
  if (!supabaseAdmin) {
    errorLogger.error(ErrorCategory.API, 'Supabase admin client not available - cannot process product webhook');
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .upsert({
        id: product.id,
        active: product.is_archived ? false : true,
        name: product.name,
        description: product.description,
        image: product.image,
        metadata: product.metadata || {},
      })
      .select();

    if (error) {
      errorLogger.error(ErrorCategory.API, 'Failed to upsert product:', error);
      return;
    }

    errorLogger.info(ErrorCategory.API, `Successfully processed product ${product.id}`);

    // Handle prices if they exist
    if (product.prices && Array.isArray(product.prices)) {
      for (const price of product.prices) {
        try {
          const { error: priceError } = await supabaseAdmin
            .from('prices')
            .upsert({
              id: price.id,
              product_id: product.id,
              active: price.is_archived ? false : true,
              unit_amount: price.price_amount,
              currency: price.price_currency,
              type: price.type,
              interval: price.recurring_interval,
              description: price.description,
              metadata: price.metadata || {},
            });

          if (priceError) {
            errorLogger.error(ErrorCategory.API, `Failed to upsert price ${price.id}:`, priceError);
          } else {
            errorLogger.info(ErrorCategory.API, `Successfully processed price ${price.id}`);
          }
        } catch (priceProcessingError) {
          errorLogger.error(ErrorCategory.API, `Error processing price ${price.id}:`, priceProcessingError);
        }
      }
    }
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Error processing product webhook:', error);
  }
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    try {
      errorLogger.info(ErrorCategory.API, `Processing Polar webhook: ${payload.type}`);
      
      switch (payload.type) {
        case 'subscription.created':
        case 'subscription.updated':
          await handleSubscription(payload.data);
          break;
        case 'product.created':
        case 'product.updated':
          await handleProduct(payload.data);
          break;
        case 'checkout.created':
        case 'checkout.updated':
          errorLogger.info(ErrorCategory.API, `Checkout event ${payload.type}: ${payload.data?.id}`);
          break;
        default:
          errorLogger.warning(ErrorCategory.API, `Unhandled Polar webhook event type: ${payload.type}`);
      }
      
      errorLogger.info(ErrorCategory.API, `Successfully processed Polar webhook: ${payload.type}`);
    } catch (error) {
      errorLogger.error(ErrorCategory.API, `Failed to process Polar webhook ${payload.type}:`, error);
      throw error; // Re-throw to signal failure to Polar
    }
  },
});
