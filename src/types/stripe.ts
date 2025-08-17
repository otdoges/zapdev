/**
 * Stripe TypeScript Interfaces
 * Properly typed interfaces to replace unsafe 'as any' casting
 */

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | 'paused';
  current_period_start: number; // Unix timestamp
  current_period_end: number; // Unix timestamp
  cancel_at_period_end: boolean;
  customer: string | StripeCustomer;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        object: 'price';
        active: boolean;
        currency: string;
        unit_amount: number;
        recurring?: {
          interval: 'month' | 'year';
          interval_count: number;
        };
      };
    }>;
  };
  metadata?: Record<string, string>;
  created: number;
  trial_start?: number;
  trial_end?: number;
}

export interface StripeCustomer {
  id: string;
  object: 'customer';
  created: number;
  email: string | null;
  name: string | null;
  metadata: Record<string, string>;
  deleted?: boolean;
}

export interface StripeInvoice {
  id: string;
  object: 'invoice';
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  customer: string | StripeCustomer;
  subscription?: string | StripeSubscription;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  created: number;
  due_date?: number;
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  type: string;
  created: number;
  data: {
    object: StripeSubscription | StripeCustomer | StripeInvoice | Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
}

// Type guards for runtime type checking
export function isStripeSubscription(obj: unknown): obj is StripeSubscription {
  return obj && obj.object === 'subscription' && typeof obj.id === 'string';
}

export function isStripeCustomer(obj: unknown): obj is StripeCustomer {
  return obj && obj.object === 'customer' && typeof obj.id === 'string';
}

export function isStripeInvoice(obj: unknown): obj is StripeInvoice {
  return obj && obj.object === 'invoice' && typeof obj.id === 'string';
}

// Utility function to safely access subscription properties
export function getSubscriptionPeriod(subscription: unknown): {
  currentPeriodStart: number;
  currentPeriodEnd: number;
} | null {
  if (!isStripeSubscription(subscription)) {
    return null;
  }
  
  return {
    currentPeriodStart: subscription.current_period_start * 1000, // Convert to milliseconds
    currentPeriodEnd: subscription.current_period_end * 1000, // Convert to milliseconds
  };
}

// Utility function to safely access customer email
export function getCustomerEmail(customer: unknown): string {
  if (!isStripeCustomer(customer) || customer.deleted) {
    return '';
  }
  
  return customer.email || '';
}

// Utility function to safely access customer metadata
export function getCustomerMetadata(customer: unknown): Record<string, string> {
  if (!isStripeCustomer(customer) || customer.deleted) {
    return {};
  }
  
  return customer.metadata || {};
}

// Utility function to safely get subscription ID from invoice
export function getInvoiceSubscriptionId(invoice: unknown): string | null {
  if (!isStripeInvoice(invoice)) {
    return null;
  }
  
  return typeof invoice.subscription === 'string' ? invoice.subscription : null;
}

// Plan type mapping
export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

export interface SubscriptionData {
  planId: PlanType;
  status: StripeSubscription['status'];
  currentPeriodStart: number; // Milliseconds
  currentPeriodEnd: number; // Milliseconds  
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
}