import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string | undefined;

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Shared subscription cache shape used by API responses
export type StripeSubCache =
  | {
      subscriptionId: string | null;
      status:
        | 'incomplete'
        | 'incomplete_expired'
        | 'trialing'
        | 'active'
        | 'past_due'
        | 'canceled'
        | 'unpaid'
        | 'paused'
        | 'none';
      priceId: string | null;
      currentPeriodStart: number | null; // seconds since epoch (Stripe default)
      currentPeriodEnd: number | null; // seconds since epoch (Stripe default)
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null;
        last4: string | null;
      } | null;
    }
  | { status: 'none' };

export async function findCustomerIdForUser(userId: string): Promise<string | null> {
  // Prefer Stripe Search API by metadata
  try {
    const search = await stripe.customers.search({
      // Metadata search per Stripe docs: metadata['key']:'value'
      // https://docs.stripe.com/search#search-query-language
      query: `metadata['userId']:'${userId.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    const customer = search.data?.[0];
    if (customer?.id) return customer.id;
  } catch {
    // Fallback to listing customers with metadata filter not available; ignore errors
  }
  return null;
}

export async function getOrCreateCustomerIdForUser(userId: string, email?: string): Promise<string> {
  const existing = await findCustomerIdForUser(userId);
  if (existing) return existing;
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  return customer.id;
}

export async function getStripeSubscriptionCache(customerId: string): Promise<StripeSubCache> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 100,
    status: 'all',
    expand: ['data.default_payment_method'],
  });

  const allSubs = subscriptions.data ?? [];
  const candidates = allSubs
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .sort((a, b) => (b.current_period_start ?? 0) - (a.current_period_start ?? 0));

  const subscription = candidates[0] ?? allSubs[0];

  if (!subscription) {
    return { status: 'none' } as const;
  }

  const subData: StripeSubCache = {
    subscriptionId: subscription.id,
    status: subscription.status as StripeSubCache extends infer T ? T extends { status: infer S } ? S : never : never,
    priceId: subscription.items.data[0]?.price?.id ?? null,
    currentPeriodStart: subscription.current_period_start ?? null,
    currentPeriodEnd: subscription.current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    paymentMethod:
      subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null,
          }
        : null,
  };

  return subData;
}


