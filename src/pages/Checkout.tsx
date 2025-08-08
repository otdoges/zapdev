import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, ClerkLoaded } from "@clerk/clerk-react";
// Experimental Clerk Billing UI (subject to change per Clerk Beta docs)
// https://clerk.com/docs/custom-flows/checkout-new-payment-method
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- experimental export may not have type defs yet
import { CheckoutProvider, useCheckout, PaymentElementProvider, PaymentElement, usePaymentElement } from "@clerk/clerk-react/experimental";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolvePlanId } from "@/lib/clerk-billing";

function CheckoutInitialization() {
  const { checkout } = useCheckout();
  const { start, status, fetchStatus } = checkout;

  if (status !== "needs_initialization") return null;

  return (
    <Button onClick={start} disabled={fetchStatus === "fetching"} className="w-full">
      {fetchStatus === "fetching" ? "Initializing..." : "Start Checkout"}
    </Button>
  );
}

function PaymentSection() {
  const navigate = useNavigate();
  const { checkout } = useCheckout();
  const { isConfirming, confirm, finalize, error } = checkout;

  const { isFormReady, submit } = usePaymentElement();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormReady || isProcessing) return;
    setIsProcessing(true);

    try {
      const { data, error: formError } = await submit();
      if (formError) return; // ignore typical validation errors surfaced by the element

      await confirm(data);
      finalize({ redirectUrl: "/settings" });
      // Fallback if finalize doesn't redirect
      navigate("/settings");
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <PaymentElement fallback={<div className="text-sm text-gray-400">Loading payment element...</div>} />
      </div>

      {error && <div className="text-sm text-red-400">{error.message}</div>}

      <Button type="submit" disabled={!isFormReady || isProcessing || isConfirming} className="w-full">
        {isProcessing || isConfirming ? "Processing..." : "Complete Purchase"}
      </Button>
    </form>
  );
}

function CheckoutSummary() {
  const { checkout } = useCheckout();
  const { plan, totals } = checkout;

  if (!plan) return null;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-300 space-y-1">
        <div className="flex justify-between"><span>{plan.name}</span><span>
          {totals.totalDueNow.currencySymbol} {totals.totalDueNow.amountFormatted}
        </span></div>
        {totals.totalRecurring && (
          <div className="flex justify-between text-gray-400">
            <span>Then</span>
            <span>
              {totals.totalRecurring.currencySymbol} {totals.totalRecurring.amountFormatted} / {plan.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomCheckout() {
  const { checkout } = useCheckout();
  const { status } = checkout;

  if (status === "needs_initialization") {
    return (
      <div className="max-w-md mx-auto">
        <CheckoutInitialization />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3 order-2 lg:order-1">
        <PaymentElementProvider checkout={checkout}>
          <PaymentSection />
        </PaymentElementProvider>
      </div>
      <div className="lg:col-span-2 order-1 lg:order-2">
        <CheckoutSummary />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const rawPlan = params.get("planId") || "pro";
  const planId = resolvePlanId(rawPlan);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-400">Secure payment powered by Clerk Billing</p>
        </div>

        <ClerkLoaded>
          <SignedIn>
            <CheckoutProvider for="user" planId={planId} planPeriod="month">
              <CustomCheckout />
            </CheckoutProvider>
          </SignedIn>
          <SignedOut>
            <div className="max-w-md mx-auto">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Sign in to continue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-300">
                  <p>You need to sign in to complete checkout.</p>
                  <SignInButton mode="modal" redirectUrl={`/checkout?planId=${planId}`}>
                    <Button className="w-full">Sign in</Button>
                  </SignInButton>
                </CardContent>
              </Card>
            </div>
          </SignedOut>
        </ClerkLoaded>
      </div>
    </div>
  );
}


