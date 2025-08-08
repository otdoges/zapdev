import React from "react";

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
}> = ({ children }) => {
  const value: CheckoutContextValue = {
    checkout: {
      status: "needs_initialization",
      fetchStatus: "idle",
      isConfirming: false,
      error: null,
      plan: { name: "Pro", period: "month" },
      totals: { totalDueNow: { amountFormatted: "0", currencySymbol: "$" }, totalRecurring: null },
      start: async () => undefined,
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


