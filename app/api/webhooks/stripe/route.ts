import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { internal } from '@/convex/_generated/api';
import { getStripeClient } from '@/lib/stripe';
import { allowedEvents } from '@/lib/stripe';

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const stripe = getStripeClient();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Check if this is an event type we want to handle
  if (!allowedEvents.includes(event.type as any)) {
    return NextResponse.json(
      { received: true, message: `Skipping unhandled event type: ${event.type}` }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Check that this is a subscription checkout
        if (
          session.mode === 'subscription' && 
          session.subscription && 
          session.customer
        ) {
          console.log(`Checkout completed for subscription: ${session.subscription}`);
          
          const stripeCustomerId = typeof session.customer === 'string' 
            ? session.customer 
            : session.customer.id;
          
          const subscription = await stripe.subscriptions.retrieve(session.subscription.toString());
          
          // Update user with subscription info in Convex
          await convex.mutation(internal.stripe.updateUserSubscription, {
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status,
            stripeCurrentPeriodEnd: subscription.current_period_end,
            stripePriceId: subscription.items.data[0]?.price?.id || '',
          });
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        
        if (invoice.customer && invoice.subscription) {
          const stripeCustomerId = typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer.id;
          
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription.toString());
          
          console.log(`Invoice paid for subscription: ${subscription.id}`);
          
          // Update subscription status
          await convex.mutation(internal.stripe.updateUserSubscription, {
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status,
            stripeCurrentPeriodEnd: subscription.current_period_end,
            stripePriceId: subscription.items.data[0]?.price?.id || '',
          });
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        if (invoice.customer && invoice.subscription) {
          const stripeCustomerId = typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer.id;
          
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription.toString());
          
          console.log(`Invoice payment failed for subscription: ${subscription.id}`);
          
          // Update subscription status
          await convex.mutation(internal.stripe.updateUserSubscription, {
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status,
            stripeCurrentPeriodEnd: subscription.current_period_end,
            stripePriceId: subscription.items.data[0]?.price?.id || '',
          });
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        if (subscription.customer) {
          const stripeCustomerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer.id;
          
          console.log(`Subscription updated for customer: ${stripeCustomerId}, status: ${subscription.status}`);
          
          // Update subscription status
          await convex.mutation(internal.stripe.updateUserSubscription, {
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status,
            stripeCurrentPeriodEnd: subscription.current_period_end,
            stripePriceId: subscription.items.data[0]?.price?.id || '',
          });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        if (subscription.customer) {
          const stripeCustomerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer.id;
          
          console.log(`Subscription deleted for customer: ${stripeCustomerId}`);
          
          // Update subscription status to canceled
          await convex.mutation(internal.stripe.updateUserSubscription, {
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: 'canceled',
            stripeCurrentPeriodEnd: subscription.current_period_end,
            stripePriceId: subscription.items.data[0]?.price?.id || '',
          });
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
} 