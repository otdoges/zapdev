import { useUser } from '@clerk/clerk-react';
import React from 'react';

export type StripePlan = {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
};

export type StripeSubscription = {
  planId: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
};

export const STRIPE_PLANS: StripePlan[] = [
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
      'Standard response time',
    ],
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
      'Team collaboration',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'SLA guarantee',
      'Custom deployment',
      'Advanced analytics',
      'Custom billing',
      'Contact us for pricing enterprise@zapdev.link',
    ],
  },
];

async function fetchJsonWithRetry<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryCount: number = 1
): Promise<T> {
  const res = await fetch(input, { credentials: 'same-origin', cache: 'no-store', ...(init || {}) });
  if (res.status === 401 && retryCount > 0) {
    // Give the browser a moment in case session cookies refresh
    await new Promise((r) => setTimeout(r, 500));
    return fetchJsonWithRetry<T>(input, init, retryCount - 1);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export function resolveStripePlanId(raw: string): 'free' | 'pro' | 'enterprise' {
  const normalized = (raw || '').toLowerCase();
  const aliases: Record<string, 'free' | 'pro' | 'enterprise'> = {
    pro: 'pro',
    professional: 'pro',
    starter: 'free',
    free: 'free',
    enterprise: 'enterprise',
    team: 'pro',
  };
  if (aliases[normalized]) return aliases[normalized];
  if (normalized === 'free' || normalized === 'pro' || normalized === 'enterprise') return normalized;
  return 'pro';
}

export const useStripeSubscription = (): {
  subscription: StripeSubscription | null;
  loading: boolean;
  error: string | null;
} => {
  const { isLoaded } = useUser();
  const [subscription, setSubscription] = React.useState<StripeSubscription | null>(null);
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
        type GetSubscriptionResponse = {
          planId?: 'free' | 'pro' | 'enterprise';
          status?: StripeSubscription['status'];
          currentPeriodStart?: number;
          currentPeriodEnd?: number;
          cancelAtPeriodEnd?: boolean;
        };
        const data = await fetchJsonWithRetry<GetSubscriptionResponse>('/api/get-subscription');
        const sub: StripeSubscription = {
          planId: data.planId ?? 'free',
          status: data.status ?? 'none',
          currentPeriodStart: data.currentPeriodStart ?? Date.now(),
          currentPeriodEnd: data.currentPeriodEnd ?? Date.now(),
          cancelAtPeriodEnd: !!data.cancelAtPeriodEnd,
        };
        if (!cancelled) setSubscription(sub);
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
  }, [isLoaded]);

  return { subscription, loading, error };
};

export async function createStripeCheckout(planId: 'pro' | 'enterprise', period: 'month' | 'year' = 'month'): Promise<{ url: string }> {
  const validPlanIds = ['pro', 'enterprise'] as const;
  const validPeriods = ['month', 'year'] as const;
  if (!validPlanIds.includes(planId) || !validPeriods.includes(period)) {
    throw new Error('Invalid checkout parameters');
  }
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ planId, period }),
  });
  if (!res.ok) throw new Error('Failed to create checkout');
  const data = await res.json();
  return { url: data.url as string };
}

export async function createStripePortal(): Promise<{ url: string }> {
  const res = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Failed to create portal session');
  const data = await res.json();
  return { url: data.url as string };
}

export function canUserPerformStripeAction(subscription: StripeSubscription | null, action: 'create_conversation' | 'execute_code' | 'use_advanced_features'): boolean {
  if (!subscription || subscription.status !== 'active') {
    return action === 'create_conversation';
  }
  const plan = STRIPE_PLANS.find((p) => p.id === subscription.planId);
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
}

export function formatStripePrice(plan: StripePlan): string {
  if (plan.price === 0) return 'Free';
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency, minimumFractionDigits: 0 });
  return `${formatter.format(plan.price)}/${plan.interval}`;
}

export function getStripePlanDisplayName(plan: StripePlan): string {
  if (plan.price === 0) return plan.name;
  return `${plan.name} - ${formatStripePrice(plan)}`;
}


