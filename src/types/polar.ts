export interface PolarCheckoutSession {
  id: string;
  url: string;
  customerId?: string;
  metadata?: Record<string, string>;
  status: 'open' | 'complete' | 'expired';
  productPriceId: string;
  productPrice: {
    id: string;
    product: {
      id: string;
      name: string;
    };
    price: number;
    currency: string;
    type: 'one_time' | 'recurring';
    recurring?: {
      interval: 'month' | 'year';
      interval_count: number;
    };
  };
  successUrl?: string;
  customerEmail?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PolarSubscription {
  id: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  customerId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  productId: string;
  productName: string;
  priceId: string;
  price: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
    interval_count: number;
  };
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolarCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolarProduct {
  id: string;
  name: string;
  description?: string;
  prices: PolarPrice[];
  benefits: PolarBenefit[];
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolarPrice {
  id: string;
  productId: string;
  type: 'one_time' | 'recurring';
  price: number;
  currency: string;
  recurring?: {
    interval: 'month' | 'year';
    interval_count: number;
  };
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolarBenefit {
  id: string;
  type: 'custom' | 'articles' | 'ads' | 'discord' | 'github_repository' | 'downloadables';
  description: string;
  selectable: boolean;
  deletable: boolean;
  organizationId: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolarWebhookEvent {
  id: string;
  type: 'subscription.created' | 'subscription.updated' | 'subscription.canceled' | 'checkout.session.completed';
  data: PolarSubscription | PolarCheckoutSession;
  createdAt: Date;
}

// Types for our application's billing system
export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

export interface UserSubscription {
  planId: PlanType;
  planName: string;
  status: 'none' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  features: readonly string[];
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSessionRequest {
  planId: PlanType;
  period?: 'month' | 'year';
}

export interface CheckoutSessionResponse {
  url: string;
  checkoutId: string;
  customerId?: string;
}

export interface CustomerPortalResponse {
  url: string;
}

// Plan feature definitions
export const PLAN_FEATURES = {
  free: [
    '10 AI conversations per month',
    'Basic code execution',
    'Community support',
    'Standard response time',
  ],
  starter: [
    '100 AI conversations per month',
    'Advanced code execution',
    'Email support',
    'Fast response time',
    'File uploads',
  ],
  pro: [
    'Unlimited AI conversations',
    'Advanced code execution',
    'Priority support',
    'Fastest response time',
    'Custom integrations',
    'Team collaboration',
    'Advanced analytics',
  ],
  enterprise: [
    'Everything in Pro',
    'Dedicated support team',
    'SLA guarantee',
    'Custom deployment',
    'Advanced security',
    'Custom billing',
    'On-premise options',
  ],
} as const;

// Polar.sh specific helper types
export interface PolarSDKConfig {
  accessToken: string;
  server?: 'production' | 'sandbox';
}

export interface PolarCheckoutCreateRequest {
  products: string[];
  customerBillingAddress?: {
    country: string;
  };
  metadata?: Record<string, string>;
  successUrl?: string;
  customerEmail?: string;
}

// Error types
export class PolarError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'PolarError';
  }
}

export class PolarCheckoutError extends PolarError {
  constructor(message: string, statusCode?: number) {
    super(message, 'CHECKOUT_ERROR', statusCode);
    this.name = 'PolarCheckoutError';
  }
}

export class PolarWebhookError extends PolarError {
  constructor(message: string, statusCode?: number) {
    super(message, 'WEBHOOK_ERROR', statusCode);
    this.name = 'PolarWebhookError';
  }
}

// Helper function to get plan features
export function getPlanFeatures(planId: PlanType): readonly string[] {
  return Object.prototype.hasOwnProperty.call(PLAN_FEATURES, planId) ? PLAN_FEATURES[planId as keyof typeof PLAN_FEATURES] : PLAN_FEATURES.free;
}

// Helper function to get plan display name
export function getPlanDisplayName(planId: PlanType): string {
  const names: Record<PlanType, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };
  return Object.prototype.hasOwnProperty.call(names, planId) ? names[planId as keyof typeof names] : 'Free';
}

// Helper function to validate plan ID
export function isValidPlanId(planId: string): planId is PlanType {
  return ['free', 'starter', 'pro', 'enterprise'].includes(planId);
}

// Helper function to convert Polar subscription to our format
export function convertPolarSubscription(
  polarSub: PolarSubscription,
  planId: PlanType
): UserSubscription {
  return {
    planId,
    planName: getPlanDisplayName(planId),
    status: polarSub.status,
    features: getPlanFeatures(planId),
    currentPeriodStart: polarSub.currentPeriodStart.getTime(),
    currentPeriodEnd: polarSub.currentPeriodEnd.getTime(),
    cancelAtPeriodEnd: polarSub.cancelAtPeriodEnd,
  };
}

// Type guards
export function isPolarSubscription(obj: unknown): obj is PolarSubscription {
  return obj && typeof obj.id === 'string' && typeof obj.status === 'string';
}

export function isPolarCheckoutSession(obj: unknown): obj is PolarCheckoutSession {
  return obj && typeof obj.id === 'string' && typeof obj.url === 'string';
}