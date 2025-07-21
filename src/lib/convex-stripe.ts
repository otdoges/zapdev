import { stripe, SubscriptionData } from './stripe';
import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Initialize Convex client
// You'll need to set VITE_CONVEX_URL in your environment
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

/**
 * Get Stripe customer ID for a Clerk user from Convex
 */
export async function getStripeCustomerId(clerkUserId: string): Promise<string | null> {
  return await convex.query(api.stripe.getStripeCustomerId, { clerkUserId });
}

/**
 * Store Stripe customer mapping in Convex
 */
export async function setStripeCustomerId(
  clerkUserId: string, 
  stripeCustomerId: string, 
  email: string, 
  name?: string
): Promise<void> {
  await convex.mutation(api.stripe.setStripeCustomer, {
    clerkUserId,
    stripeCustomerId,
    email,
    name,
  });
}

/**
 * Get subscription data from Convex
 */
export async function getSubscriptionData(stripeCustomerId: string): Promise<SubscriptionData | null> {
  return await convex.query(api.stripe.getSubscriptionData, { stripeCustomerId });
}

/**
 * Get subscription data by Clerk user ID
 */
export async function getSubscriptionByClerkUserId(clerkUserId: string): Promise<SubscriptionData | null> {
  return await convex.query(api.stripe.getSubscriptionByClerkUserId, { clerkUserId });
}

/**
 * Store subscription data in Convex
 */
export async function setSubscriptionData(stripeCustomerId: string, data: SubscriptionData): Promise<void> {
  if (data.status === 'none' || data.status === 'error') {
    // Don't store incomplete data
    return;
  }

  await convex.mutation(api.stripe.setSubscriptionData, {
    stripeCustomerId,
    subscriptionId: data.subscriptionId!,
    priceId: data.priceId!,
    status: data.status,
    currentPeriodStart: data.currentPeriodStart!,
    currentPeriodEnd: data.currentPeriodEnd!,
    cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
    paymentMethod: data.paymentMethod,
    planName: data.planName,
  });
}

/**
 * Core function: Sync Stripe subscription data to Convex
 * This fetches the latest subscription data from Stripe and stores it in Convex
 */
export async function syncStripeDataToConvex(customerId: string): Promise<SubscriptionData> {
  try {
    // Fetch the latest subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // If no subscriptions exist
    if (subscriptions.data.length === 0) {
      const data: SubscriptionData = { status: 'none' };
      return data;
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0] as any;
    
    // Extract payment method info if available
    let paymentMethod = null;
    if (subscription.default_payment_method) {
      const pm = subscription.default_payment_method;
      if (pm.card) {
        paymentMethod = {
          brand: pm.card.brand,
          last4: pm.card.last4,
        };
      }
    }

    // Get plan name from Stripe price
    let planName = undefined;
    try {
      if (subscription.items.data[0]?.price?.id) {
        const price = await stripe.prices.retrieve(subscription.items.data[0].price.id, {
          expand: ['product']
        });
        if (price.product && typeof price.product === 'object') {
          planName = price.product.name;
        }
      }
    } catch (error) {
      console.warn('Could not fetch plan name:', error);
    }

    // Build subscription data object
    const subscriptionData: SubscriptionData = {
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price?.id,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod,
      planName,
    };

    // Store in Convex
    await setSubscriptionData(customerId, subscriptionData);
    
    return subscriptionData;
  } catch (error) {
    console.error('Error syncing Stripe data to Convex:', error);
    
    // Return error state but don't throw - we want to handle gracefully
    const errorData: SubscriptionData = { status: 'error' };
    return errorData;
  }
}

/**
 * Create or get existing Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  clerkUserId: string, 
  userEmail: string, 
  userName?: string
): Promise<string> {
  // Check if we already have a customer ID for this user in Convex
  const customerId = await getStripeCustomerId(clerkUserId);
  
  if (customerId) {
    // Verify the customer still exists in Stripe
    try {
      await stripe.customers.retrieve(customerId);
      return customerId;
    } catch (error) {
      // Customer doesn't exist in Stripe anymore, create a new one
      console.warn(`Stripe customer ${customerId} not found, creating new one`);
    }
  }
  
  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: userEmail,
    name: userName,
    metadata: {
      clerkUserId: clerkUserId,
    },
  });
  
  // Store the mapping in Convex
  await setStripeCustomerId(clerkUserId, customer.id, userEmail, userName);
  
  return customer.id;
} 