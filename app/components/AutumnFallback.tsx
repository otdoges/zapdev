// Fallback implementations for Autumn React components
// This file provides working alternatives when autumn-js/react is not available

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

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

const AutumnContext = createContext<{
  customer: Customer | null;
  isLoading: boolean;
  error: string | null;
}>({
  customer: null,
  isLoading: false,
  error: null
});

export const AutumnProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: ['5 chats', '1 sandbox', 'Basic models'],
      buttonText: 'Get Started',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$20',
      period: 'per month',
      description: 'For builders who want more',
      features: ['Unlimited chats', 'Advanced models'],
      buttonText: 'Upgrade to Pro',
      popular: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative ${plan.popular ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}
        >
          {plan.popular && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              MOST POPULAR
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">{plan.price}</span>
              {plan.period && <span className="text-gray-500 ml-1">{plan.period}</span>}
            </div>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
              {plan.buttonText}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

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