import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Stripe webhook events that trigger subscription data sync
export const allowedEvents: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
];

// Subscription data structure stored in Convex
export interface SubscriptionData {
  subscriptionId?: string;
  status: string;
  priceId?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
  } | null;
  planName?: string; // Added planName property
}

// Helper function to extract customer ID from Stripe event
export function extractCustomerIdFromEvent(event: Stripe.Event): string | null {
  const eventData = event.data.object as any;
  
  switch (event.type) {
    case 'checkout.session.completed':
      return (eventData as Stripe.Checkout.Session).customer as string;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return (eventData as Stripe.Subscription).customer as string;
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
      return (eventData as Stripe.Invoice).customer as string;
    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
      return (eventData as Stripe.PaymentIntent).customer as string;
    default:
      return null;
  }
} 