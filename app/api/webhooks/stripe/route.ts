import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getStripeClient } from '@/lib/stripe';
import { allowedEvents } from '@/lib/stripe';

// Defensive Convex client creation
const createConvexClient = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL not found, using placeholder");
    return new ConvexHttpClient("https://placeholder.convex.cloud");
  }
  return new ConvexHttpClient(convexUrl);
};

const convex = createConvexClient();

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

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
          session.customer && 
          session.metadata?.userId
        ) {
          console.log(`Checkout completed for user: ${session.metadata.userId}, subscription: ${session.subscription}`);
          
          // Update user with subscription info in Convex
          await convex.mutation(api.users.updateUserSubscription, {
            clerkId: session.metadata.userId,
            stripeCustomerId: session.customer.toString(),
            stripeSubscriptionId: session.subscription.toString(),
            planType: session.metadata.priceType || 'pro', // Default to 'pro' if not specified
            isActive: true,
          });
        }
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        
        if (invoice.customer) {
          // Get customer metadata to find user ID
          const customer = await stripe.customers.retrieve(invoice.customer.toString());
          const subscriptionId = invoice.subscription?.toString();
          
          if ('metadata' in customer && customer.metadata?.userId && subscriptionId) {
            console.log(`Invoice paid for user: ${customer.metadata.userId}, subscription: ${subscriptionId}`);
            
            // Update subscription status to active
            await convex.mutation(api.users.updateSubscriptionStatus, {
              stripeSubscriptionId: subscriptionId,
              isActive: true,
            });
          }
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        if (invoice.customer) {
          // Get customer metadata to find user ID
          const customer = await stripe.customers.retrieve(invoice.customer.toString());
          const subscriptionId = invoice.subscription?.toString();
          
          if ('metadata' in customer && customer.metadata?.userId && subscriptionId) {
            console.log(`Invoice payment failed for user: ${customer.metadata.userId}, subscription: ${subscriptionId}`);
            
            // Update subscription status to inactive
            await convex.mutation(api.users.updateSubscriptionStatus, {
              stripeSubscriptionId: subscriptionId,
              isActive: false,
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        if (subscription.customer) {
          // Get customer metadata to find user ID
          const customerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer.id;
            
          const customer = await stripe.customers.retrieve(customerId);
          
          if ('metadata' in customer && customer.metadata?.userId) {
            console.log(`Subscription updated for user: ${customer.metadata.userId}, status: ${subscription.status}`);
            
            // Update subscription status based on subscription status
            await convex.mutation(api.users.updateSubscriptionStatus, {
              stripeSubscriptionId: subscription.id,
              isActive: subscription.status === 'active',
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        if (subscription.customer) {
          // Get customer metadata to find user ID
          const customerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer.id;
            
          const customer = await stripe.customers.retrieve(customerId);
          
          if ('metadata' in customer && customer.metadata?.userId) {
            console.log(`Subscription deleted for user: ${customer.metadata.userId}`);
            
            // Update subscription status to inactive
            await convex.mutation(api.users.updateSubscriptionStatus, {
              stripeSubscriptionId: subscription.id,
              isActive: false,
            });
          }
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