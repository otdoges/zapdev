"use client";

import { useState } from "react";
import SubscriptionPlans, {
  type PricingPlan,
} from "@/components/stripe/SubscriptionPlans";
import CheckoutButton from "@/components/stripe/CheckoutButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CreditCard, TestTube, DollarSign } from "lucide-react";

const testPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Testing free tier",
    price: 0,
    currency: "usd",
    interval: "month",
    features: [
      "5 chats",
      "Basic models",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Testing Pro plan",
    price: 20,
    currency: "usd",
    interval: "month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_test_pro",
    features: [
      "Unlimited chats",
      "Advanced models",
    ],
    buttonText: "Upgrade to Pro",
  },
];

export default function TestPricingPage() {
  const [customAmount, setCustomAmount] = useState<number>(5);
  const [customCurrency, setCustomCurrency] = useState<string>("usd");
  const [testMode, setTestMode] = useState<"payment" | "subscription">(
    "payment",
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <TestTube className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              Stripe Pricing Test
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Test the Stripe payment integration with various pricing scenarios
            and configurations.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Test Subscription Plans
          </h2>
          <SubscriptionPlans plans={testPlans} />
        </div>

        <Separator className="my-12" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Custom Amount Test
              </CardTitle>
              <CardDescription>
                Test payments with custom amounts and currencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    min="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value)}
                  >
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                    <option value="gbp">GBP</option>
                    <option value="cad">CAD</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="mode">Payment Mode</Label>
                <Select
                  value={testMode}
                  onChange={(e) =>
                    setTestMode(e.target.value as "payment" | "subscription")
                  }
                >
                  <option value="payment">One-time Payment</option>
                  <option value="subscription">Monthly Subscription</option>
                </Select>
              </div>

              <CheckoutButton
                customAmount={{
                  amount: Math.round(customAmount * 100),
                  currency: customCurrency,
                  name: `Custom ${testMode === "subscription" ? "Subscription" : "Payment"} Test`,
                  description: `Testing ${testMode} with ${customAmount} ${customCurrency.toUpperCase()}`,
                }}
                mode={testMode}
                variant="default"
                size="lg"
                className="w-full"
              >
                Test Custom {testMode === "subscription" ? "Subscription" : "Payment"} - {customAmount} {customCurrency.toUpperCase()}
              </CheckoutButton>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Quick Test Scenarios
              </CardTitle>
              <CardDescription>
                Pre-configured test scenarios for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CheckoutButton
                customAmount={{
                  amount: 100,
                  currency: "usd",
                  name: "Minimum Payment Test",
                  description: "Testing minimum payment amount",
                }}
                mode="payment"
                variant="outline"
                size="lg"
                className="w-full"
              >
                Test $1.00 Payment
              </CheckoutButton>

              <CheckoutButton
                customAmount={{
                  amount: 1999,
                  currency: "usd",
                  name: "Standard Subscription Test",
                  description: "Testing standard subscription pricing",
                }}
                mode="subscription"
                variant="default"
                size="lg"
                className="w-full"
              >
                Test $19.99/month Subscription
              </CheckoutButton>

              <CheckoutButton
                customAmount={{
                  amount: 4999,
                  currency: "usd",
                  name: "Premium Payment Test",
                  description: "Testing higher-value payments",
                }}
                mode="payment"
                variant="orange"
                size="lg"
                className="w-full"
              >
                Test $49.99 One-time Payment
              </CheckoutButton>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Testing Information</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Test Credit Cards</h4>
                <ul className="space-y-1 text-sm">
                  <li><code>4242424242424242</code> - Visa (Success)</li>
                  <li><code>4000000000000002</code> - Visa (Declined)</li>
                  <li><code>4000000000009995</code> - Visa (Insufficient funds)</li>
                  <li><code>4000002500003155</code> - Visa (Requires authentication)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Test Details</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Use any future expiry date (e.g., 12/34)</li>
                  <li>• Use any 3-digit CVC code</li>
                  <li>• Use any ZIP code</li>
                  <li>• All payments are in test mode</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
