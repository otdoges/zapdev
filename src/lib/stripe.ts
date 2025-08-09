// Shared Stripe subscription types and helpers for the frontend

export type StripeSubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'
  | 'none';

export type StripeSubscriptionCache =
  | {
      subscriptionId: string | null;
      status: StripeSubscriptionStatus;
      priceId: string | null;
      currentPeriodStart: number | null; // seconds since epoch (Stripe default)
      currentPeriodEnd: number | null;   // seconds since epoch (Stripe default)
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null;
        last4: string | null;
      } | null;
    }
  | { status: 'none' };

export interface NormalizedSubscription {
  planId: 'free' | 'pro' | 'enterprise';
  status: StripeSubscriptionStatus;
  currentPeriodStart: number; // ms
  currentPeriodEnd: number;   // ms
  cancelAtPeriodEnd: boolean;
}

export function mapStripeCacheToSubscription(cache: StripeSubscriptionCache | null): NormalizedSubscription {
  if (!cache || cache.status === 'none') {
    return {
      planId: 'free',
      status: 'none',
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now(),
      cancelAtPeriodEnd: false,
    };
  }

  const priceId = cache.priceId || '';
  const planId: 'free' | 'pro' | 'enterprise' = priceId.includes('enterprise')
    ? 'enterprise'
    : priceId.includes('pro')
    ? 'pro'
    : 'free';

  return {
    planId,
    status: cache.status,
    currentPeriodStart: (cache.currentPeriodStart || 0) * 1000 || Date.now(),
    currentPeriodEnd: (cache.currentPeriodEnd || 0) * 1000 || Date.now(),
    cancelAtPeriodEnd: !!cache.cancelAtPeriodEnd,
  };
}


