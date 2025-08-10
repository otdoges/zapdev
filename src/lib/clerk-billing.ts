/**
 * Deprecated: Clerk billing shim. Forward to Stripe billing.
 */
import type { StripeSubscription, StripePlan } from './stripe-billing';

export type NormalizedSubscription = StripeSubscription;
export type ClerkSubscription = StripeSubscription;
export type ClerkPlan = StripePlan;
export const BILLING_PLANS: ClerkPlan[] = [];
export const CLERK_BILLING_CONFIG = {} as const;
export { 
  useStripeSubscription as useUserSubscription, 
  createStripeCheckout as createCheckoutSession, 
  createStripePortal as createCustomerPortalSession, 
  canUserPerformStripeAction as canUserPerformAction, 
  formatStripePrice as formatPrice, 
  getStripePlanDisplayName as getPlanDisplayName, 
  resolveStripePlanId as resolvePlanId 
} from './stripe-billing';