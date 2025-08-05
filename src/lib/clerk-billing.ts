/**
 * Clerk Billing Integration
 * Replaces Stripe integration with Clerk's native billing solution
 * https://clerk.com/docs/billing/overview
 */

import { useUser } from "@clerk/clerk-react";

// Clerk billing configuration
export const CLERK_BILLING_CONFIG = {
  // Add your billing configuration here
  baseUrl: import.meta.env.VITE_CLERK_BILLING_BASE_URL || 'https://api.clerk.dev/v1',
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
};

// Billing plan types
export interface ClerkPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

// User subscription status
export interface ClerkSubscription {
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

// Mock plans - replace with actual Clerk billing plans
export const BILLING_PLANS: ClerkPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '10 AI conversations per month',
      'Basic code execution',
      'Community support',
      'Standard response time'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users and developers',
    price: 20,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited AI conversations',
      'Advanced code execution',
      'Priority support',
      'Fast response time',
      'Custom integrations',
      'Team collaboration'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    price: 100,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'SLA guarantee',
      'Custom deployment',
      'Advanced analytics',
      'Custom billing'
    ]
  }
];

/**
 * Get user's current subscription status
 * In a real implementation, this would query Clerk's billing API
 */
export const useUserSubscription = (): {
  subscription: ClerkSubscription | null;
  loading: boolean;
  error: string | null;
} => {
  const { user, isLoaded } = useUser();

  // Mock implementation - replace with actual Clerk billing API calls
  if (!isLoaded) {
    return { subscription: null, loading: true, error: null };
  }

  if (!user) {
    return { subscription: null, loading: false, error: null };
  }

  // Check user metadata for subscription info
  const subscriptionData = user.publicMetadata?.subscription as ClerkSubscription | undefined;

  return {
    subscription: subscriptionData || {
      planId: 'free',
      status: 'active',
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false
    },
    loading: false,
    error: null
  };
};

/**
 * Create a checkout session for upgrading subscription
 * This would integrate with Clerk's billing system
 */
export const createCheckoutSession = async (planId: string): Promise<{ url: string }> => {
  try {
    // In a real implementation, this would call Clerk's billing API
    // For now, we'll simulate the process
    
    const plan = BILLING_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Mock checkout URL - replace with actual Clerk billing URL
    const checkoutUrl = `https://billing.clerk.dev/checkout?plan=${planId}&return_url=${encodeURIComponent(window.location.origin)}/billing/success`;
    
    return { url: checkoutUrl };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Create a customer portal session for managing subscription
 * This would integrate with Clerk's billing system
 */
export const createCustomerPortalSession = async (): Promise<{ url: string }> => {
  try {
    // Mock portal URL - replace with actual Clerk billing portal
    const portalUrl = `https://billing.clerk.dev/portal?return_url=${encodeURIComponent(window.location.origin)}/settings`;
    
    return { url: portalUrl };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
};

/**
 * Cancel user's subscription
 */
export const cancelSubscription = async (): Promise<void> => {
  try {
    // In a real implementation, this would call Clerk's billing API
    console.log('Canceling subscription...');
    
    // Update user metadata to reflect cancellation
    // This would be handled by Clerk's billing webhooks in production
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

/**
 * Reactivate user's subscription
 */
export const reactivateSubscription = async (): Promise<void> => {
  try {
    // In a real implementation, this would call Clerk's billing API
    console.log('Reactivating subscription...');
    
    // Update user metadata to reflect reactivation
    // This would be handled by Clerk's billing webhooks in production
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
};

/**
 * Get user's usage for billing purposes
 */
export const getUserUsage = async (): Promise<{
  conversations: number;
  codeExecutions: number;
  resetDate: number;
}> => {
  try {
    // In a real implementation, this would query your usage tracking system
    return {
      conversations: 5, // Mock data
      codeExecutions: 12,
      resetDate: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
  } catch (error) {
    console.error('Error fetching user usage:', error);
    throw error;
  }
};

/**
 * Check if user can perform an action based on their subscription
 */
export const canUserPerformAction = (
  subscription: ClerkSubscription | null,
  action: 'create_conversation' | 'execute_code' | 'use_advanced_features'
): boolean => {
  if (!subscription || subscription.status !== 'active') {
    // Free tier limitations
    return action === 'create_conversation'; // Allow basic conversations only
  }

  const plan = BILLING_PLANS.find(p => p.id === subscription.planId);
  if (!plan) return false;

  switch (action) {
    case 'create_conversation':
      return true; // All plans allow conversations
    case 'execute_code':
      return plan.id !== 'free'; // Free plan has limited code execution
    case 'use_advanced_features':
      return plan.id === 'pro' || plan.id === 'enterprise';
    default:
      return false;
  }
};

/**
 * Format price for display
 */
export const formatPrice = (plan: ClerkPlan): string => {
  if (plan.price === 0) {
    return 'Free';
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: plan.currency,
    minimumFractionDigits: 0,
  });
  
  return `${formatter.format(plan.price)}/${plan.interval}`;
};

/**
 * Get plan display name with interval
 */
export const getPlanDisplayName = (plan: ClerkPlan): string => {
  if (plan.price === 0) {
    return plan.name;
  }
  
  return `${plan.name} - ${formatPrice(plan)}`;
};