import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const getStripeCustomer = async (clerkUserId: string) => {
  const customers = await stripe.customers.list({
    metadata: { clerkUserId },
    limit: 1,
  });
  
  return customers.data.length > 0 ? customers.data[0] : null;
};

export const createStripeCustomer = async (clerkUserId: string, email: string, name?: string) => {
  return await stripe.customers.create({
    email,
    name,
    metadata: { clerkUserId },
  });
};

export const getOrCreateStripeCustomer = async (clerkUserId: string, email: string, name?: string) => {
  let customer = await getStripeCustomer(clerkUserId);
  
  if (!customer) {
    customer = await createStripeCustomer(clerkUserId, email, name);
  }
  
  return customer;
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