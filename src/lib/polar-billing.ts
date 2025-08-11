// This file has been replaced by Autumn billing. Keeping a thin re-export for compatibility during migration.
export type NormalizedSubscription = import('./autumn-billing').AutumnSubscription;
export type ClerkSubscription = import('./autumn-billing').AutumnSubscription;
export type ClerkPlan = import('./autumn-billing').AutumnPlan;
export const BILLING_PLANS = [] as unknown as import('./autumn-billing').AutumnPlan[];
export const POLAR_BILLING_CONFIG = {} as const;
export { useAutumnSubscription as useUserSubscription, createAutumnCheckout as createCheckoutSession, createAutumnPortal as createCustomerPortalSession, canUserPerformAutumnAction as canUserPerformAction, formatAutumnPrice as formatPrice, getAutumnPlanDisplayName as getPlanDisplayName } from './autumn-billing';


