import React from "react";
import { useUser } from "@clerk/clerk-react";

// Simple billing plans for compatibility
const BILLING_PLANS = [
  { id: 'free', name: 'Free', price: 0 },
  { id: 'pro', name: 'Pro', price: 29 },
  { id: 'enterprise', name: 'Enterprise', price: 0 },
];

// Simple checkout function that redirects to API
async function createCheckoutSession(planId: string, period: string): Promise<{ url: string }> {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, period }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  return response.json();
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

  const start = React.useCallback(async () => {
    try {
      setFetchStatus("fetching");
      setError(null);
      const { url } = await createCheckoutSession((resolvedPlan.id as 'pro' | 'enterprise'), 'month');
      window.location.href = url;
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


