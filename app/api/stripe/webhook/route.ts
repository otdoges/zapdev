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

// Webhook URL validation function
function isValidWebhookURL(req: NextRequest): boolean {
  // In a production environment, you might want to validate:
  // 1. The URL scheme (https only in production)
  // 2. The domain (ensure it's your expected domain)
  // 3. The path (ensure it's exactly /api/stripe/webhook)
  
  const url = new URL(req.url);
  const path = url.pathname;
  const isHttps = url.protocol === 'https:';
  
  // Basic validation - ensure the path is correct
  if (path !== '/api/stripe/webhook') {
    return false;
  }
  
  // In production, you might want to enforce HTTPS
  // For now, we'll allow both HTTP and HTTPS for development flexibility
  return true;
}

export async function POST(req: NextRequest) {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
  }

  // Validate webhook URL to ensure it matches expected format
  if (!isValidWebhookURL(req)) {
    console.error('Invalid webhook URL detected:', req.url);
    return NextResponse.json(
      { error: 'Invalid webhook URL' },
      { status: 400 }
    );
  }

  try {
    // Check if this is a 307 redirect and handle appropriately
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const host = req.headers.get('host');
    const originalUrl = `${forwardedProto}://${host}${req.nextUrl.pathname}`;
    
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

    // Event deduplication - prevent processing the same event multiple times
    const eventId = event.id;
    const eventKey = `processed-stripe-event-${eventId}`;
    
    // Note: In a production environment, you would use Redis or a database for this
    // For now, we'll just log that we're checking for duplicates
    console.log(`Processing webhook event: ${event.type} (ID: ${eventId})`);
    
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
    // Structured logging for debugging webhook issues
    console.error('Webhook handler error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      webhookEvent: event?.type || 'Unknown event type',
      eventId: event?.id || 'Unknown event ID'
    });
    
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
    // Add to dead letter queue for manual processing
    addToDeadLetterQueue('checkout.session.completed', session.id, 'Missing userId in metadata', session);
    return;
  }

  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
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
    // Add to dead letter queue for retry
    addToDeadLetterQueue('checkout.session.completed', session.id, 'Failed to update subscription in Convex', session);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata');
    // Add to dead letter queue for manual processing
    addToDeadLetterQueue('customer.subscription.created', subscription.id, 'Missing userId in metadata', subscription);
    return;
  }

  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    await convex.mutation(api.users.upsertUserSubscription, {
      userId,
      planId: subscription.items.data[0]?.price.id || 'pro',
      status: subscription.status as any,
      currentPeriodStart: (subscription as any).current_period_start,
      currentPeriodEnd: (subscription as any).current_period_end,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    });

    console.log(`Subscription created for user: ${userId}, status: ${subscription.status}`);
  } catch (error) {
    console.error('Failed to create subscription in Convex:', error);
    // Add to dead letter queue for retry
    addToDeadLetterQueue('customer.subscription.created', subscription.id, 'Failed to create subscription in Convex', subscription);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata');
    // Add to dead letter queue for manual processing
    addToDeadLetterQueue('customer.subscription.updated', subscription.id, 'Missing userId in metadata', subscription);
    return;
  }

  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    await convex.mutation(api.users.upsertUserSubscription, {
      userId,
      planId: subscription.items.data[0]?.price.id || 'pro',
      status: subscription.status as any,
      currentPeriodStart: (subscription as any).current_period_start,
      currentPeriodEnd: (subscription as any).current_period_end,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    });

    console.log(`Subscription updated for user: ${userId}, status: ${subscription.status}`);
  } catch (error) {
    console.error('Failed to update subscription in Convex:', error);
    // Add to dead letter queue for retry
    addToDeadLetterQueue('customer.subscription.updated', subscription.id, 'Failed to update subscription in Convex', subscription);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata');
    // Add to dead letter queue for manual processing
    addToDeadLetterQueue('customer.subscription.deleted', subscription.id, 'Missing userId in metadata', subscription);
    return;
  }

  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    await convex.mutation(api.users.upsertUserSubscription, {
      userId,
      planId: 'free',
      status: 'canceled',
      currentPeriodStart: (subscription as any).current_period_start,
      currentPeriodEnd: (subscription as any).current_period_end,
      cancelAtPeriodEnd: true,
    });

    console.log(`Subscription cancelled for user: ${userId}`);
  } catch (error) {
    console.error('Failed to cancel subscription in Convex:', error);
    // Add to dead letter queue for retry
    addToDeadLetterQueue('customer.subscription.deleted', subscription.id, 'Failed to cancel subscription in Convex', subscription);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId || !invoice.customer_email) {
    // Add to dead letter queue for manual processing
    addToDeadLetterQueue('invoice.payment_succeeded', invoice.id, 'Missing subscriptionId or customer_email', invoice);
    return;
  }

  console.log(`Payment succeeded for subscription: ${subscriptionId}, amount: ${invoice.amount_paid}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) {
    // Add to dead letter queue for manual processing
    addToDeadLetterQueue('invoice.payment_failed', invoice.id, 'Missing subscriptionId', invoice);
    return;
  }

  console.log(`Payment failed for subscription: ${subscriptionId}`);
  // Add to dead letter queue for retry or investigation
  addToDeadLetterQueue('invoice.payment_failed', invoice.id, 'Invoice payment failed', invoice);
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id);
  console.log(`Customer created: ${customer.email}`);
  // Log for monitoring but no need for dead letter queue as this is less critical
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id);
  console.log(`Customer updated: ${customer.email}`);
  // Log for monitoring but no need for dead letter queue as this is less critical
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  const userId = paymentIntent.metadata?.userId;
  if (!userId) {
    console.error('No userId found in payment intent metadata');
    // Add to dead letter queue for manual processing
    addToDeadLetterQueue('payment_intent.succeeded', paymentIntent.id, 'Missing userId in metadata', paymentIntent);
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
    // Add to dead letter queue for manual processing
    addToDeadLetterQueue('payment_intent.payment_failed', paymentIntent.id, 'Missing userId in metadata', paymentIntent);
    return;
  }

  console.log(`Payment intent failed for user: ${userId}`);
  // Add to dead letter queue for retry or investigation
  addToDeadLetterQueue('payment_intent.payment_failed', paymentIntent.id, 'Payment intent failed', paymentIntent);
}

async function handleChargeUpdated(charge: Stripe.Charge) {
  console.log('Charge updated:', charge.id);
  console.log(`Charge status: ${charge.status}, amount: ${charge.amount}`);
  // Log for monitoring but no need for dead letter queue as this is less critical
}

// Dead letter queue implementation for failed webhook events
async function addToDeadLetterQueue(eventType: string, eventId: string, errorMessage: string, eventData: any) {
  try {
    // In a production environment, you would store this in a database or queue system
    // For now, we'll log it for visibility
    console.warn('Dead letter queue item added:', {
      eventType,
      eventId,
      errorMessage,
      timestamp: new Date().toISOString(),
      eventData: JSON.stringify(eventData, null, 2)
    });
    
    // You could also send this to an external service like SQS, RabbitMQ, etc.
    // Or store it in a database table for manual processing
    
    // For alerting purposes, you might want to track consecutive failures
    // and notify your team after a certain threshold
    await checkConsecutiveFailures(eventType, eventId, errorMessage);
  } catch (error) {
    console.error('Failed to add event to dead letter queue:', error);
  }
}

// Track consecutive failures and alert if threshold is exceeded
async function checkConsecutiveFailures(eventType: string, eventId: string, errorMessage: string) {
  // In a production implementation, you would:
  // 1. Store failure count in a database or Redis
  // 2. Increment the count for this event type
  // 3. If count exceeds threshold (e.g., 5), send an alert to your team
  // 4. Reset count after a certain time period or after a successful event
  
  // This is a placeholder for the actual implementation
  console.log(`Checking consecutive failures for event type: ${eventType}`);
  
  // For now, we'll just check if this is a Stripe signature verification error
  // which might indicate a configuration issue that needs immediate attention
  if (errorMessage.includes('signature verification failed')) {
    console.error('CRITICAL: Stripe webhook secret misconfiguration detected!');
    // In a real implementation, you would send an alert here
  }
}

// Webhook event replay mechanism
export async function PUT(req: NextRequest) {
  // Endpoint to manually replay failed webhook events
  // This would typically be protected by authentication in production
  try {
    const { eventId } = await req.json();
    
    // In a real implementation, you would:
    // 1. Retrieve the event data from storage (database, queue, etc.)
    // 2. Re-process the event using the same logic as the webhook handler
    // 3. Update the dead letter queue status accordingly
    
    return NextResponse.json({ 
      message: `Event ${eventId} replay request received`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to replay event' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Health check endpoint for monitoring webhook accessibility
  const webhookUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/stripe/webhook`;
  return NextResponse.json({ 
    status: 'Webhook endpoint is active',
    url: webhookUrl,
    timestamp: new Date().toISOString()
  });
}