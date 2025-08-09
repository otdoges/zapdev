/**
 * Clerk Billing Integration
 * Replaces Stripe integration with Clerk's native billing solution
 * https://clerk.com/docs/billing/overview
 */

import { useUser } from "@clerk/clerk-react";
import React from "react";
import { mapStripeCacheToSubscription, type NormalizedSubscription } from "./stripe";

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
 * Resolve incoming plan identifiers (aliases, case-insensitive) to a known plan id.
 * Falls back to 'pro' if unknown.
 */
export function resolvePlanId(raw: string): string {
  const normalized = (raw || '').toLowerCase();
  const aliases: Record<string, string> = {
    pro: 'pro',
    professional: 'pro',
    starter: 'free',
    free: 'free',
    enterprise: 'enterprise',
    team: 'pro',
  };
  const mapped = aliases[normalized] || normalized;
  const exists = BILLING_PLANS.some(p => p.id === mapped);
  return exists ? mapped : 'pro';
}

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
  const [subscription, setSubscription] = React.useState<ClerkSubscription | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!isLoaded) {
          setSubscription(null);
          setLoading(true);
          return;
        }
        // Prefer Convex user id stored by app during auth
        const convexUserId = localStorage.getItem('convexUserId');
        if (!convexUserId) {
          setSubscription({
            planId: 'free',
            status: 'none',
            currentPeriodStart: Date.now(),
            currentPeriodEnd: Date.now(),
            cancelAtPeriodEnd: false,
          });
          setLoading(false);
          return;
        }
        // Resolve customer id
        const customerIdRes = await fetch(`/api/kv-proxy?key=${encodeURIComponent(`stripe:user:${convexUserId}`)}`);
        if (!customerIdRes.ok) {
          setSubscription({
            planId: 'free',
            status: 'none',
            currentPeriodStart: Date.now(),
            currentPeriodEnd: Date.now(),
            cancelAtPeriodEnd: false,
          });
          setLoading(false);
          return;
        }
        const customerId = await customerIdRes.text();
        // Load subscription cache
        const subRes = await fetch(`/api/kv-proxy?key=${encodeURIComponent(`stripe:customer:${customerId}`)}&json=1`);
        if (!subRes.ok) {
          setSubscription({
            planId: 'free',
            status: 'none',
            currentPeriodStart: Date.now(),
            currentPeriodEnd: Date.now(),
            cancelAtPeriodEnd: false,
          });
          setLoading(false);
          return;
        }
        const sub = await subRes.json();
        const normalized: NormalizedSubscription = mapStripeCacheToSubscription(sub);
        const result: ClerkSubscription = {
          planId: normalized.planId,
          status: normalized.status as ClerkSubscription['status'],
          currentPeriodStart: normalized.currentPeriodStart,
          currentPeriodEnd: normalized.currentPeriodEnd,
          cancelAtPeriodEnd: normalized.cancelAtPeriodEnd,
        };
        if (!cancelled) setSubscription(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load subscription');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  return { subscription, loading, error };
};

/**
 * Create a checkout session for upgrading subscription
 * This would integrate with Clerk's billing system
 */
export const createCheckoutSession = async (
  planId: string,
  options?: { userId?: string; email?: string; period?: 'month' | 'year' }
): Promise<{ url: string }> => {
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error('Plan not found');
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: plan.id, period: options?.period || plan.interval, userId: options?.userId, email: options?.email }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create checkout session');
  }
  const data = await res.json();
  if (!data?.url) throw new Error('Invalid response from checkout session API');
  return { url: data.url };
};

/**
 * Create a customer portal session for managing subscription
 * This would integrate with Clerk's billing system
 */
export const createCustomerPortalSession = async (): Promise<{ url: string }> => {
  try {
    const convexUserId = localStorage.getItem('convexUserId');
    const res = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: convexUserId || undefined, returnUrl: `${window.location.origin}/settings` }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Failed to create portal session');
    }
    const data = await res.json();
    if (!data?.url) throw new Error('Invalid response from portal session API');
    return { url: data.url };
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