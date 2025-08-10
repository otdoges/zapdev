// This file has been replaced by Stripe billing. Keeping a thin re-export for compatibility during migration.
export type NormalizedSubscription = import('./stripe-billing').StripeSubscription;
export type ClerkSubscription = import('./stripe-billing').StripeSubscription;
export type ClerkPlan = import('./stripe-billing').StripePlan;
export const BILLING_PLANS = [] as unknown as import('./stripe-billing').StripePlan[];
export const POLAR_BILLING_CONFIG = {} as const;
export { useStripeSubscription as useUserSubscription, createStripeCheckout as createCheckoutSession, createStripePortal as createCustomerPortalSession, canUserPerformStripeAction as canUserPerformAction, formatStripePrice as formatPrice, getStripePlanDisplayName as getPlanDisplayName } from './stripe-billing';


