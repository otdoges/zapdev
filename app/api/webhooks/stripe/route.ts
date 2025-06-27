import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripeClient } from '@/lib/stripe';
import { allowedEvents } from '@/lib/stripe';
import Stripe from 'stripe';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

// Initialize Supabase client with service role key for webhooks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create Supabase client if both env vars are available
const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    errorLogger.warning(ErrorCategory.API, 'Missing Supabase environment variables');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const stripe = getStripeClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Check if this is an event type we want to handle
  if (!allowedEvents.includes(event.type as any)) {
    return NextResponse.json({
      received: true,
      message: `Skipping unhandled event type: ${event.type}`,
    });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    errorLogger.error(
      ErrorCategory.API,
      'Supabase client not available, webhook processing skipped'
    );
    return NextResponse.json({ received: true, warning: 'Database updates skipped' });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check that this is a subscription checkout
        if (
          session.mode === 'subscription' &&
          session.subscription &&
          session.customer &&
          session.metadata?.userId
        ) {
          errorLogger.info(
            ErrorCategory.API,
            `Checkout completed for user: ${session.metadata.userId}, subscription: ${session.subscription}`
          );

          // Update user with subscription info in Supabase
          const { error } = await supabase
            .from('users')
            .update({
              stripe_customer_id: session.customer.toString(),
              stripe_subscription_id: session.subscription.toString(),
              subscription_plan: session.metadata.priceType || 'pro',
              subscription_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', session.metadata.userId);

          if (error) {
            errorLogger.error(ErrorCategory.API, 'Error updating user subscription:', error);
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.customer) {
          // Get customer metadata to find user ID
          const customer = await stripe.customers.retrieve(invoice.customer.toString());

          if ('metadata' in customer && customer.metadata?.userId) {
            errorLogger.info(
              ErrorCategory.API,
              `Invoice paid for user: ${customer.metadata.userId}`
            );

            // Update subscription status to active for any active subscriptions
            const { error } = await supabase
              .from('users')
              .update({
                subscription_active: true,
                updated_at: new Date().toISOString(),
              })
              .eq('auth_user_id', customer.metadata.userId);

            if (error) {
              errorLogger.error(ErrorCategory.API, 'Error updating subscription status:', error);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.customer) {
          // Get customer metadata to find user ID
          const customer = await stripe.customers.retrieve(invoice.customer.toString());

          if ('metadata' in customer && customer.metadata?.userId) {
            errorLogger.info(
              ErrorCategory.API,
              `Invoice payment failed for user: ${customer.metadata.userId}`
            );

            // Update subscription status to inactive
            const { error } = await supabase
              .from('users')
              .update({
                subscription_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq('auth_user_id', customer.metadata.userId);

            if (error) {
              errorLogger.error(ErrorCategory.API, 'Error updating subscription status:', error);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        if (subscription.customer) {
          // Get customer metadata to find user ID
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id;

          const customer = await stripe.customers.retrieve(customerId);

          if ('metadata' in customer && customer.metadata?.userId) {
            errorLogger.info(
              ErrorCategory.API,
              `Subscription updated for user: ${customer.metadata.userId}, status: ${subscription.status}`
            );

            // Update subscription status based on subscription status
            const { error } = await supabase
              .from('users')
              .update({
                subscription_active: subscription.status === 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscription.id);

            if (error) {
              errorLogger.error(ErrorCategory.API, 'Error updating subscription status:', error);
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        if (subscription.customer) {
          // Get customer metadata to find user ID
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id;

          const customer = await stripe.customers.retrieve(customerId);

          if ('metadata' in customer && customer.metadata?.userId) {
            errorLogger.info(
              ErrorCategory.API,
              `Subscription deleted for user: ${customer.metadata.userId}`
            );

            // Update subscription status to inactive
            const { error } = await supabase
              .from('users')
              .update({
                subscription_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscription.id);

            if (error) {
              errorLogger.error(ErrorCategory.API, 'Error updating subscription status:', error);
            }
          }
        }
        break;
      }

      default:
        errorLogger.info(ErrorCategory.API, `Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Error processing webhook:', error);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }
}
