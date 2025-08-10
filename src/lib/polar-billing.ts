/**
 * Polar Billing Integration (UI helpers)
 * Uses server API endpoints backed by Polar hosted checkout/portal and REST.
 */

import { useUser } from "@clerk/clerk-react";
import React from "react";

export type NormalizedSubscription = {
  planId: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
};

export const POLAR_BILLING_CONFIG = {} as const;

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

// Mock plans for display
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

// Resolve plan id aliases
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

// Current subscription via our Polar-backed API
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
        const token = localStorage.getItem('authToken') || '';
        const subRes = await fetch(`/api/get-subscription`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
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
        const normalized = normalizePolarSubscription(sub);
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
    return () => { cancelled = true; };
  }, [isLoaded, user?.id]);

  return { subscription, loading, error };
};

// Create a checkout session using Polar hosted checkout URLs
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

// Normalize API subscription payload to UI shape
function normalizePolarSubscription(input: unknown): NormalizedSubscription {
  if (!input || typeof input !== 'object') {
    return {
      planId: 'free',
      status: 'none',
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now(),
      cancelAtPeriodEnd: false,
    };
  }
  const obj = input as Record<string, unknown> & {
    planId?: 'free' | 'pro' | 'enterprise';
    status?: string;
    currentPeriodStart?: number;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
  };
  return {
    planId: (obj.planId as 'free' | 'pro' | 'enterprise') || 'free',
    status: (obj.status as NormalizedSubscription['status']) || 'none',
    currentPeriodStart: typeof obj.currentPeriodStart === 'number' ? obj.currentPeriodStart : Date.now(),
    currentPeriodEnd: typeof obj.currentPeriodEnd === 'number' ? obj.currentPeriodEnd : Date.now(),
    cancelAtPeriodEnd: !!obj.cancelAtPeriodEnd,
  };
}

// Open Polar portal (hosted) via API
export const createCustomerPortalSession = async (): Promise<{ url: string }> => {
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
};

export const cancelSubscription = async (): Promise<void> => {
  console.warn('cancelSubscription not implemented for Polar hosted billing');
};

export const reactivateSubscription = async (): Promise<void> => {
  console.warn('reactivateSubscription not implemented for Polar hosted billing');
};

// Usage helpers (mocked)
export const getUserUsage = async (): Promise<{
  conversations: number;
  codeExecutions: number;
  resetDate: number;
}> => {
  return {
    conversations: 5,
    codeExecutions: 12,
    resetDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
  };
};

export const canUserPerformAction = (
  subscription: ClerkSubscription | null,
  action: 'create_conversation' | 'execute_code' | 'use_advanced_features'
): boolean => {
  if (!subscription || subscription.status !== 'active') {
    return action === 'create_conversation';
  }
  const plan = BILLING_PLANS.find(p => p.id === subscription.planId);
  if (!plan) return false;
  switch (action) {
    case 'create_conversation':
      return true;
    case 'execute_code':
      return plan.id !== 'free';
    case 'use_advanced_features':
      return plan.id === 'pro' || plan.id === 'enterprise';
    default:
      return false;
  }
};

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

export const getPlanDisplayName = (plan: ClerkPlan): string => {
  if (plan.price === 0) {
    return plan.name;
  }
  return `${plan.name} - ${formatPrice(plan)}`;
};


