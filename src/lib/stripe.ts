import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  successUrl: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/success`,
  cancelUrl: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/pricing`,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

// Re-export Stripe types for application use
export type StripeProduct = Stripe.Product;
export type StripePrice = Stripe.Price;
export type StripeSubscription = Stripe.Subscription;
export type StripeCustomer = Stripe.Customer;
export type StripeCheckoutSession = Stripe.Checkout.Session;

// Custom subscription cache type following the reference pattern
export type STRIPE_SUB_CACHE =
  | {
      subscriptionId: string;
      status: Stripe.Subscription.Status;
      priceId: string;
      currentPeriodStart: number;
      currentPeriodEnd: number;
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null; // e.g., "visa", "mastercard"
        last4: string | null; // e.g., "4242"
      } | null;
    }
  | {
      status: "none";
    };

// Usage event interface for billing
export interface UsageEvent {
  eventName: string;
  userId: string;
  metadata: Record<string, string | number | boolean>;
  timestamp?: number;
}

/**
 * Get or create a Stripe customer for a user
 * Following the reference pattern of always having a customer before checkout
 */
export const getOrCreateStripeCustomer = async (
  userId: string,
  email: string,
  name?: string
): Promise<string> => {
  try {
    // First, try to find existing customer by metadata
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      // Update metadata if it doesn't have userId
      if (!customer.metadata?.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { userId },
        });
      }
      return customer.id;
    }

    // Create new customer
    const newCustomer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId, // DO NOT FORGET THIS - as emphasized in the reference
      },
    });

    return newCustomer.id;
  } catch (error) {
    console.error('Error getting or creating Stripe customer:', error);
    throw error;
  }
};

/**
 * Create a checkout session for a subscription
 * Following the reference pattern of always having a customer before checkout
 */
export const createCheckoutSession = async (
  stripeCustomerId: string,
  priceId: string,
  metadata?: Record<string, string>
): Promise<{ url: string }> => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId, // ALWAYS create checkout with a customer ID
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      metadata,
      // Following reference recommendations
      subscription_data: {
        metadata,
      },
      // Disable Cash App Pay as recommended in the reference
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session',
        },
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return { url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Create a customer portal session for subscription management
 */
export const createCustomerPortalSession = async (
  stripeCustomerId: string
): Promise<{ url: string }> => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/settings`,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
};

/**
 * Sync Stripe subscription data to cache
 * This is the core function following the reference pattern
 */
export const syncStripeDataToCache = async (
  stripeCustomerId: string
): Promise<STRIPE_SUB_CACHE> => {
  try {
    // Fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      const subData = { status: "none" as const };
      return subData;
    }

    // If a user can have multiple subscriptions, that's your problem
    const subscription = subscriptions.data[0];

    // Store complete subscription state
    const subData: STRIPE_SUB_CACHE = {
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      currentPeriodEnd: subscription.current_period_end,
      currentPeriodStart: subscription.current_period_start,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod:
        subscription.default_payment_method &&
        typeof subscription.default_payment_method !== "string"
          ? {
              brand: subscription.default_payment_method.card?.brand ?? null,
              last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : null,
    };

    return subData;
  } catch (error) {
    console.error('Error syncing Stripe data:', error);
    throw error;
  }
};

/**
 * Get subscription status for a customer
 */
export const getSubscriptionStatus = async (
  stripeCustomerId: string
): Promise<STRIPE_SUB_CACHE> => {
  return await syncStripeDataToCache(stripeCustomerId);
};

/**
 * Cancel a subscription
 */
export const cancelSubscription = async (
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> => {
  try {
    if (cancelAtPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

/**
 * Reactivate a subscription
 */
export const reactivateSubscription = async (
  subscriptionId: string
): Promise<Stripe.Subscription> => {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
};

/**
 * Get all products and prices from Stripe
 */
export const getProductsAndPrices = async (): Promise<{
  products: StripeProduct[];
  prices: StripePrice[];
}> => {
  try {
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true }),
      stripe.prices.list({ active: true }),
    ]);

    return {
      products: products.data,
      prices: prices.data,
    };
  } catch (error) {
    console.error('Error fetching products and prices:', error);
    throw error;
  }
};

/**
 * Record usage event for billing
 */
export const recordUsageEvent = async (event: UsageEvent): Promise<void> => {
  try {
    // For now, we'll just log the event
    // In a full implementation, you might send this to Stripe's usage records
    // or store it in your database for later processing
    console.log('Usage event recorded:', event);
    
    // TODO: Implement actual usage recording based on your billing model
    // This could involve Stripe's usage records API for metered billing
  } catch (error) {
    console.error('Error recording usage event:', error);
    throw error;
  }
};

// Events to track for webhook processing (following reference pattern)
export const STRIPE_WEBHOOK_EVENTS: Stripe.Event.Type[] = [
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
