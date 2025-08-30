'use client';

import { Check, Zap, Crown, Rocket } from 'lucide-react';
import CheckoutButton from './CheckoutButton';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  priceId?: string;
  features: string[];
  popular?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  buttonText?: string;
  buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'code' | 'orange' | 'ghost';
}

interface SubscriptionPlansProps {
  plans: PricingPlan[];
  className?: string;
}

const defaultPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out Zapdev',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      '5 AI-powered projects',
      'Basic templates',
      'Community support',
      'Standard sandbox time',
    ],
    icon: Zap,
    buttonText: 'Get Started',
    buttonVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For individual developers',
    price: 20,
    currency: 'usd',
    interval: 'month',
    priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    features: [
      'Unlimited AI-powered projects',
      'Premium templates',
      'Priority support',
      'Extended sandbox time',
      'Advanced AI models',
      'Export to GitHub',
    ],
    popular: true,
    icon: Crown,
    buttonText: 'Upgrade to Pro',
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For teams and organizations',
    price: 50,
    currency: 'usd',
    interval: 'month',
    priceId: 'price_team_monthly', // Replace with actual Stripe price ID
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Shared projects',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
      'SSO authentication',
    ],
    icon: Rocket,
    buttonText: 'Upgrade to Team',
    buttonVariant: 'orange',
  },
];

export default function SubscriptionPlans({ 
  plans = defaultPlans, 
  className = '' 
}: SubscriptionPlansProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {plans.map((plan) => {
        const Icon = plan.icon || Zap;
        
        return (
          <div
            key={plan.id}
            className={`
              relative rounded-[20px] border border-zinc-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg
              ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}
            `}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="flex items-center mb-4">
              <Icon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
                <p className="text-sm text-zinc-600">{plan.description}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-zinc-900">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                {plan.price > 0 && (
                  <span className="text-zinc-600 ml-2">
                    /{plan.interval}
                  </span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {plan.price === 0 ? (
                <CheckoutButton
                  customAmount={{
                    amount: 0,
                    currency: plan.currency,
                    name: plan.name,
                    description: plan.description,
                  }}
                  mode="payment"
                  variant={plan.buttonVariant || 'outline'}
                  size="lg"
                  className="w-full"
                >
                  {plan.buttonText}
                </CheckoutButton>
              ) : plan.priceId ? (
                <CheckoutButton
                  priceId={plan.priceId}
                  mode="subscription"
                  variant={plan.buttonVariant || 'default'}
                  size="lg"
                  className="w-full"
                >
                  {plan.buttonText}
                </CheckoutButton>
              ) : (
                <CheckoutButton
                  customAmount={{
                    amount: plan.price * 100, // Convert to cents
                    currency: plan.currency,
                    name: plan.name,
                    description: plan.description,
                  }}
                  mode="subscription"
                  variant={plan.buttonVariant || 'default'}
                  size="lg"
                  className="w-full"
                >
                  {plan.buttonText}
                </CheckoutButton>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}