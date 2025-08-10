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

  // For Polar flow, we may only have a plan id already; fall back to 'free' if unknown
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

// Helper to map server-side StripeSubCache type from API to this frontend type
export function mapServerSubToCache(data: unknown): StripeSubscriptionCache | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown> & { status?: string };
  if (obj.status === 'none') return { status: 'none' };
  return {
    subscriptionId: typeof obj.subscriptionId === 'string' ? (obj.subscriptionId as string) : null,
    status: (obj.status as StripeSubscriptionStatus) || 'none',
    priceId: typeof obj.priceId === 'string' ? (obj.priceId as string) : null,
    currentPeriodStart: typeof obj.currentPeriodStart === 'number' ? (obj.currentPeriodStart as number) : null,
    currentPeriodEnd: typeof obj.currentPeriodEnd === 'number' ? (obj.currentPeriodEnd as number) : null,
    cancelAtPeriodEnd: !!(obj.cancelAtPeriodEnd as boolean | undefined),
    paymentMethod: obj.paymentMethod && typeof obj.paymentMethod === 'object'
      ? {
          brand: (obj.paymentMethod as Record<string, unknown>).brand ?? null,
          last4: (obj.paymentMethod as Record<string, unknown>).last4 ?? null,
        }
      : null,
  };
}


