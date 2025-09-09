// Fallback implementations for Autumn React components
// This file provides working alternatives when autumn-js/react is not available

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown } from "lucide-react";
import CheckoutButton from "@/components/stripe/CheckoutButton";

// Types
interface Customer {
  id: string;
  email: string;
  name: string;
  subscription: {
    status: 'active' | 'inactive' | 'trialing' | 'canceled';
    planId: string;
    currentPeriodEnd: number;
  };
}

interface UsageLimit {
  featureId: string;
  allowed: boolean;
  remaining?: number;
  resetAt?: Date;
}

// Mock context
const AutumnContext = createContext<{
  customer: Customer | null;
  isLoading: boolean;
  error: string | null;
}>({
  customer: null,
  isLoading: false,
  error: null
});

// Mock provider
export const AutumnProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock loading customer data
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setCustomer({
        id: 'cus_mock123',
        email: 'user@example.com',
        name: 'Test User',
        subscription: {
          status: 'inactive',
          planId: 'free',
          currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000
        }
      });
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <AutumnContext.Provider value={{ customer, isLoading, error }}>
      {children}
    </AutumnContext.Provider>
  );
};

// Mock hook for customer data
export const useCustomer = () => {
  const context = useContext(AutumnContext);
  return {
    data: context.customer,
    isLoading: context.isLoading,
    error: context.error
  };
};

// Mock pricing table component (two-tier)
export const PricingTable: React.FC = () => {
  const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro_monthly';

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      subtext: 'No credit card required',
      description: 'Everything you need to get started.',
      features: ['Up to 5 chats', 'Basic templates', 'Standard sandbox time', 'Community support'],
      buttonText: 'Get started',
      popular: false,
      icon: Sparkles,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$20',
      subtext: 'per month, cancel anytime',
      description: 'Build without limits with advanced AI.',
      features: ['Unlimited chats', 'Advanced AI models', 'Extended sandbox time', 'Priority support'],
      buttonText: 'Upgrade to Pro',
      popular: true,
      icon: Crown,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isFree = plan.id === 'free';
        return (
          <Card
            key={plan.id}
            className={`relative transition hover:shadow-md hover:scale-[1.01] ${plan.popular ? 'ring-1 ring-primary/20' : ''}`}
          >
            {plan.popular && (
              <div className="absolute top-3 right-3">
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  Most popular
                </span>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.subtext}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6" role="list">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-500 mr-3 mt-0.5" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {isFree ? (
                <Link href="/sign-in" className="block w-full" aria-label="Get started with Free">
                  <Button variant="outline" className="w-full">{plan.buttonText}</Button>
                </Link>
              ) : (
                <CheckoutButton priceId={proPriceId} mode="subscription" variant="orange" size="lg" className="w-full">
                  {plan.buttonText}
                </CheckoutButton>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Mock usage limit hook
export const useUsageLimits = (featureId: string) => {
  const [limits, setLimits] = useState<UsageLimit | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setLimits({
        featureId,
        allowed: true,
        remaining: 1000
      });
      setIsLoading(false);
    }, 300);
  }, [featureId]);

  return {
    data: limits,
    isLoading,
    mutate: () => {},
    isValidating: false
  };
};
