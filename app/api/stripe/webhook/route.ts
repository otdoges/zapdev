import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.created':
        await handlePaymentIntentCreated(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.updated':
        await handleChargeUpdated(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);
  
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId found in session metadata');
    return;
  }

  try {
    // Update user subscription in Convex
    await convex.mutation(api.users.upsertUserSubscription, {
      userId,
      planId: session.metadata?.planId || 'pro',
      status: 'active',
      currentPeriodStart: Math.floor(Date.now() / 1000),
      currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    });

    console.log(`Payment successful for user: ${userId}, amount: ${session.amount_total}`);
  } catch (error) {
    console.error('Failed to update subscription in Convex:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  try {
    await convex.mutation(api.users.upsertUserSubscription, {
      userId,
      planId: subscription.items.data[0]?.price.id || 'pro',
      status: subscription.status as any,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(`Subscription created for user: ${userId}, status: ${subscription.status}`);
  } catch (error) {
    console.error('Failed to create subscription in Convex:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  try {
    await convex.mutation(api.users.upsertUserSubscription, {
      userId,
      planId: subscription.items.data[0]?.price.id || 'pro',
      status: subscription.status as any,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(`Subscription updated for user: ${userId}, status: ${subscription.status}`);
  } catch (error) {
    console.error('Failed to update subscription in Convex:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  try {
    await convex.mutation(api.users.upsertUserSubscription, {
      userId,
      planId: 'free',
      status: 'canceled',
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: true,
    });

    console.log(`Subscription cancelled for user: ${userId}`);
  } catch (error) {
    console.error('Failed to cancel subscription in Convex:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId || !invoice.customer_email) {
    return;
  }

  console.log(`Payment succeeded for subscription: ${subscriptionId}, amount: ${invoice.amount_paid}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) {
    return;
  }

  console.log(`Payment failed for subscription: ${subscriptionId}`);
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id);
  console.log(`Customer created: ${customer.email}`);
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id);
  console.log(`Customer updated: ${customer.email}`);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  const userId = paymentIntent.metadata?.userId;
  if (!userId) {
    console.error('No userId found in payment intent metadata');
    return;
  }

  console.log(`Payment intent succeeded for user: ${userId}, amount: ${paymentIntent.amount}`);
}

async function handlePaymentIntentCreated(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent created:', paymentIntent.id);
  
  const userId = paymentIntent.metadata?.userId;
  if (userId) {
    console.log(`Payment intent created for user: ${userId}, amount: ${paymentIntent.amount}`);
  } else {
    console.log(`Payment intent created: ${paymentIntent.id}, amount: ${paymentIntent.amount}`);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);
  
  const userId = paymentIntent.metadata?.userId;
  if (!userId) {
    console.error('No userId found in payment intent metadata');
    return;
  }

  console.log(`Payment intent failed for user: ${userId}`);
}

async function handleChargeUpdated(charge: Stripe.Charge) {
  console.log('Charge updated:', charge.id);
  console.log(`Charge status: ${charge.status}, amount: ${charge.amount}`);
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}