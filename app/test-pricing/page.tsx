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
    id: "test-free",
    name: "Test Free Plan",
    description: "Testing free tier functionality",
    price: 0,
    currency: "usd",
    interval: "month",
    features: [
      "Free tier testing",
      "Basic Stripe integration",
      "No payment required",
    ],
    buttonText: "Test Free Plan",
    buttonVariant: "outline",
  },
  {
    id: "test-basic",
    name: "Test Basic",
    description: "Basic paid plan for testing",
    price: 10,
    currency: "usd",
    interval: "month",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_TEST_BASIC_PRICE_ID || "price_test_basic",
    features: [
      "Test basic payments",
      "Stripe checkout flow",
      "Subscription management",
      "Test webhooks",
    ],
    buttonText: "Test Basic Plan",
    buttonVariant: "default",
  },
  {
    id: "test-premium",
    name: "Test Premium",
    description: "Premium plan for comprehensive testing",
    price: 25,
    currency: "usd",
    interval: "month",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_TEST_PREMIUM_PRICE_ID ||
      "price_test_premium",
    features: [
      "All basic features",
      "Advanced payment testing",
      "Multiple payment methods",
      "Subscription updates",
      "Proration testing",
    ],
    popular: true,
    buttonText: "Test Premium Plan",
    buttonVariant: "default",
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
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <TestTube className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              Stripe Pricing Test
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Test the Stripe payment integration with various pricing scenarios
            and configurations. This page demonstrates the full payment flow
            including subscriptions, one-time payments, and custom amounts.
          </p>
        </div>

        {/* Test Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Test Subscription Plans
          </h2>
          <SubscriptionPlans plans={testPlans} />
        </div>

        <Separator className="my-12" />

        {/* Custom Testing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Custom Payment Test */}
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
                  amount: Math.round(customAmount * 100), // Convert to cents
                  currency: customCurrency,
                  name: `Custom ${testMode === "subscription" ? "Subscription" : "Payment"} Test`,
                  description: `Testing ${testMode} with ${customAmount} ${customCurrency.toUpperCase()}`,
                }}
                mode={testMode}
                variant="default"
                size="lg"
                className="w-full"
              >
                Test Custom{" "}
                {testMode === "subscription" ? "Subscription" : "Payment"} -{" "}
                {customAmount} {customCurrency.toUpperCase()}
              </CheckoutButton>
            </CardContent>
          </Card>

          {/* Quick Test Buttons */}
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
                  amount: 100, // $1.00
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
                  amount: 999, // $9.99
                  currency: "usd",
                  name: "Standard Subscription Test",
                  description: "Testing standard subscription pricing",
                }}
                mode="subscription"
                variant="default"
                size="lg"
                className="w-full"
              >
                Test $9.99/month Subscription
              </CheckoutButton>

              <CheckoutButton
                customAmount={{
                  amount: 4999, // $49.99
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

              <CheckoutButton
                customAmount={{
                  amount: 0,
                  currency: "usd",
                  name: "Free Trial Test",
                  description: "Testing free trial flow",
                }}
                mode="payment"
                variant="ghost"
                size="lg"
                className="w-full"
                disabled
              >
                Test Free Trial (Disabled)
              </CheckoutButton>
            </CardContent>
          </Card>
        </div>

        {/* Test Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Testing Information</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Test Credit Cards</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code>4242424242424242</code> - Visa (Success)
                  </li>
                  <li>
                    <code>4000000000000002</code> - Visa (Declined)
                  </li>
                  <li>
                    <code>4000000000009995</code> - Visa (Insufficient funds)
                  </li>
                  <li>
                    <code>4000002500003155</code> - Visa (Requires
                    authentication)
                  </li>
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
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> This page is for testing Stripe
                integration. No real payments will be processed. Make sure your
                environment variables are set correctly with Stripe test keys.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
