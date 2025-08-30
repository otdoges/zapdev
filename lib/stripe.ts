import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

export const getStripeCustomer = async (clerkUserId: string): Promise<Stripe.Customer | null> => {
  try {
    const searchResult = await stripe.customers.search({
      query: `metadata['clerkUserId']:'${clerkUserId}'`,
    });
    const customer = searchResult.data[0];
    return customer ?? null;
  } catch (error) {
    console.warn('getStripeCustomer search failed, returning null', error);
    return null;
  }
};

export const createStripeCustomer = async (
  clerkUserId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> => {
  return await stripe.customers.create({
    email: email || undefined,
    name: name || undefined,
    metadata: { clerkUserId },
  });
};

export const getOrCreateStripeCustomer = async (
  clerkUserId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> => {
  const existing = await getStripeCustomer(clerkUserId);
  if (existing) return existing;
  const created = await createStripeCustomer(clerkUserId, email, name);
  return created;
};

export const formatAmountForDisplay = (amount: number, currency: string): string => {
  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  });
  return numberFormat.format(amount / 100);
};

export const formatAmountForStripe = (amount: number, currency: string): number => {
  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  });

  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = false;

  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
      break;
    } else if (part.type === 'currency') {
      zeroDecimalCurrency = ['JPY', 'KRW', 'VND', 'CLP'].includes(currency.toUpperCase());
    }
  }

  return zeroDecimalCurrency ? Math.round(amount) : Math.round(amount * 100);
};

export default stripe;