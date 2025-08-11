/**
 * Deprecated: Clerk billing shim. Forward to Autumn billing.
 */
import type { AutumnSubscription, AutumnPlan } from './autumn-billing';

export type NormalizedSubscription = AutumnSubscription;
export type ClerkSubscription = AutumnSubscription;
export type ClerkPlan = AutumnPlan;
export const BILLING_PLANS: ClerkPlan[] = [];
export const CLERK_BILLING_CONFIG = {} as const;
export { 
  useAutumnSubscription as useUserSubscription, 
  createAutumnCheckout as createCheckoutSession, 
  createAutumnPortal as createCustomerPortalSession, 
  canUserPerformAutumnAction as canUserPerformAction, 
  formatAutumnPrice as formatPrice, 
  getAutumnPlanDisplayName as getPlanDisplayName, 
  resolveAutumnPlanId as resolvePlanId 
} from './autumn-billing';