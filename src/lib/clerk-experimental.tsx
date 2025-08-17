import React from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { trpcClient } from '@/lib/trpc';
import { authTokenManager } from '@/lib/auth-token';

// Simple billing plans for compatibility
const BILLING_PLANS = [
  { id: 'free', name: 'Free', price: 0 },
  { id: 'starter', name: 'Starter', price: 9 },
  { id: 'pro', name: 'Pro', price: 29 },
  { id: 'enterprise', name: 'Enterprise', price: 0 },
];

// Simple checkout via tRPC to avoid API route dependency
async function createCheckoutSession(
  planId: 'pro' | 'starter' | 'enterprise',
  period: 'month' | 'year'
): Promise<{ url: string }> {
  // Input validation
  const validPlanIds = ['pro', 'starter', 'enterprise'] as const;
  const validPeriods = ['month', 'year'] as const;
  
  if (!validPlanIds.includes(planId)) {
    throw new Error(`Invalid planId: ${planId}. Must be one of: ${validPlanIds.join(', ')}`);
  }
  
  if (!validPeriods.includes(period)) {
    throw new Error(`Invalid period: ${period}. Must be one of: ${validPeriods.join(', ')}`);
  }
  
  try {
    // No type assertion needed because inputs are already validated & typed
    const result = await trpcClient.mutation('billing.createCheckoutSession', {
      planId,
      period,
    });
    
    if (!result?.url) {
      throw new Error('Checkout session created but no URL returned');
    }
    
    return { url: result.url };
  } catch (error) {
    // Enhanced error handling with context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to create checkout session: ${errorMessage}`);
  }
}

type CheckoutStatus =
  | "idle"
  | "needs_initialization"
  | "ready"
  | "confirming";

interface CheckoutContextValue {
  checkout: {
    status: CheckoutStatus;
    fetchStatus: "idle" | "fetching";
    isConfirming: boolean;
    error: { message: string } | null;
    plan?: { name: string; period?: string } | null;
    totals: {
      totalDueNow: { amountFormatted: string; currencySymbol: string };
      totalRecurring?: { amountFormatted: string; currencySymbol: string } | null;
    };
    start: () => Promise<void> | void;
    confirm: (data?: unknown) => Promise<void> | void;
    finalize: (opts?: { redirectUrl?: string }) => Promise<void> | void;
  };
}

const CheckoutContext = React.createContext<CheckoutContextValue | null>(null);

export const CheckoutProvider: React.FC<{
  children: React.ReactNode;
  for?: "user" | "org";
  planId?: string;
  planPeriod?: "month" | "year";
}> = ({ children, planId = "pro", planPeriod = "month" }) => {
  const [status] = React.useState<CheckoutStatus>("idle");
  const [fetchStatus, setFetchStatus] = React.useState<"idle" | "fetching">("idle");
  const [error, setError] = React.useState<{ message: string } | null>(null);

  const resolvedPlan = React.useMemo(() => {
    return BILLING_PLANS.find(p => p.id === planId) || BILLING_PLANS.find(p => p.id === "pro")!;
  }, [planId]);

  const { user } = useUser();
  const { getToken } = useClerkAuth();

  const start = React.useCallback(async () => {
    try {
      setFetchStatus("fetching");
      setError(null);
      try {
        const fresh = await getToken();
        if (fresh) authTokenManager.setToken(fresh);
      } catch (tokenError) {
        console.error('Failed to refresh authentication token:', tokenError);
        // Clear stored token if refresh failed to prevent stale token issues
        authTokenManager.clearToken();
      }
      // Proceed only for paid plans; free plans do not require checkout
      if (resolvedPlan.id === 'pro' || resolvedPlan.id === 'starter' || resolvedPlan.id === 'enterprise') {
        const { url } = await createCheckoutSession(
          resolvedPlan.id as 'pro' | 'starter' | 'enterprise',
          (planPeriod || 'month') as 'month' | 'year'
        );
        window.location.href = url;
      } else {
        // Handle free plan – nothing to do, but could redirect or show a message
        console.info('Selected plan is free; no checkout required.');
        return;
      }
    } catch (e) {
      console.error("Checkout start failed", e);
      setError({ message: "Failed to start checkout. Please try again." });
    } finally {
      setFetchStatus("idle");
    }
  }, [resolvedPlan.id, user?.id, user?.primaryEmailAddress?.emailAddress]);

  const value: CheckoutContextValue = {
    checkout: {
      status,
      fetchStatus,
      isConfirming: false,
      error,
      plan: { name: resolvedPlan.name, period: planPeriod },
      totals: {
        totalDueNow: {
          amountFormatted: String(resolvedPlan.price || 0),
          currencySymbol: "$",
        },
        totalRecurring: resolvedPlan.price > 0 ? {
          amountFormatted: String(resolvedPlan.price),
          currencySymbol: "$",
        } : null,
      },
      start,
      confirm: async () => undefined,
      finalize: async () => undefined,
    },
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
};

export const useCheckout = () => {
  const ctx = React.useContext(CheckoutContext);
  if (!ctx) {
    return {
      checkout: {
        status: "idle" as CheckoutStatus,
        fetchStatus: "idle" as const,
        isConfirming: false,
        error: { message: "Clerk experimental checkout not available" },
        plan: null,
        totals: { totalDueNow: { amountFormatted: "0", currencySymbol: "$" } },
        start: async () => undefined,
        confirm: async () => undefined,
        finalize: async () => undefined,
      },
    } as CheckoutContextValue;
  }
  return ctx;
};

export const PaymentElementProvider: React.FC<{ children: React.ReactNode; checkout?: unknown }> = ({ children }) => {
  return <>{children}</>;
};

export const PaymentElement: React.FC<{ fallback?: React.ReactNode }> = ({ fallback }) => {
  return <div>{fallback || "Payment element unavailable"}</div>;
};

export const usePaymentElement = () => {
  return {
    isFormReady: false,
    submit: async () => ({ data: {}, error: { message: "Unavailable" } }),
  } as const;
};


