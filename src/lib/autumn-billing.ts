import React from 'react';

// Autumn billing types - keeping similar interface to Stripe for compatibility
export type AutumnPlan = {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
};

export type AutumnSubscription = {
  planId: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
};

// Plan configurations - these will be used by Autumn internally
export const AUTUMN_PLANS: AutumnPlan[] = [
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

// Hook to get subscription status - simplified for Autumn
export const useAutumnSubscription = (): {
  subscription: AutumnSubscription | null;
  loading: boolean;
  error: string | null;
} => {
  const [subscription, setSubscription] = React.useState<AutumnSubscription | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // For now, we'll default to free plan since Autumn manages subscriptions internally
    // This can be enhanced later to fetch actual subscription status from Autumn API
    const defaultSubscription: AutumnSubscription = {
      planId: 'free',
      status: 'none',
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now(),
      cancelAtPeriodEnd: false,
    };
    
    setSubscription(defaultSubscription);
    setLoading(false);
  }, []);

  return { subscription, loading, error };
};

// Autumn doesn't need separate checkout creation since it's handled by PricingTable
// But we keep this for compatibility during transition
export async function createAutumnCheckout(planId: 'pro' | 'enterprise'): Promise<{ url: string }> {
  // Autumn handles checkout internally through PricingTable component
  // This is a placeholder for compatibility
  console.warn('createAutumnCheckout called - Autumn handles checkout through PricingTable component');
  return { url: '/pricing' };
}

// Autumn customer portal - placeholder for compatibility
export async function createAutumnPortal(): Promise<{ url: string }> {
  // Autumn handles portal internally
  // This is a placeholder for compatibility
  console.warn('createAutumnPortal called - Autumn handles portal internally');
  return { url: '/pricing' };
}

// User permissions - simplified for Autumn
export function canUserPerformAutumnAction(
  subscription: AutumnSubscription | null, 
  action: 'create_conversation' | 'execute_code' | 'use_advanced_features'
): boolean {
  if (!subscription || subscription.status !== 'active') {
    return action === 'create_conversation';
  }
  
  const plan = AUTUMN_PLANS.find((p) => p.id === subscription.planId);
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

// Price formatting utility
export function formatAutumnPrice(plan: AutumnPlan): string {
  if (plan.price === 0) return 'Free';
  const formatter = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: plan.currency, 
    minimumFractionDigits: 0 
  });
  return `${formatter.format(plan.price)}/${plan.interval}`;
}

// Plan display name utility
export function getAutumnPlanDisplayName(plan: AutumnPlan): string {
  if (plan.price === 0) return plan.name;
  return `${plan.name} - ${formatAutumnPrice(plan)}`;
}

// Plan resolver utility - maps string to valid plan ID
export function resolveAutumnPlanId(raw: string): 'free' | 'pro' | 'enterprise' {
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

// Export aliases for backward compatibility during transition
export const STRIPE_PLANS = AUTUMN_PLANS;
export const useStripeSubscription = useAutumnSubscription;
export const createStripeCheckout = createAutumnCheckout;
export const createStripePortal = createAutumnPortal;
export const canUserPerformStripeAction = canUserPerformAutumnAction;
export const formatStripePrice = formatAutumnPrice;
export const getStripePlanDisplayName = getAutumnPlanDisplayName;
export const resolveStripePlanId = resolveAutumnPlanId;

// Type aliases for backward compatibility
export type StripePlan = AutumnPlan;
export type StripeSubscription = AutumnSubscription;