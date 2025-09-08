'use client';

import Link from 'next/link';
import { Check, Sparkles, Crown } from 'lucide-react';
import CheckoutButton from './CheckoutButton';
import { Button } from '@/components/ui/button';

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
  plans?: PricingPlan[];
  className?: string;
}

const defaultPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Everything you need to get started.',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: ['Up to 5 chats', 'Basic templates', 'Standard sandbox time', 'Community support'],
    icon: Sparkles,
    buttonText: 'Get started',
    buttonVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Build without limits with advanced AI.',
    price: 20,
    currency: 'usd',
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    features: ['Unlimited chats', 'Advanced AI models', 'Extended sandbox time', 'Priority support'],
    popular: true,
    icon: Crown,
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'orange',
  },
];

export default function SubscriptionPlans({ plans = defaultPlans, className = '' }: SubscriptionPlansProps) {
  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${className}`}>
      {plans.map((plan) => {
        const Icon = plan.icon || Sparkles;
        const isFree = plan.id === 'free';
        const isPro = plan.id === 'pro';

        return (
          <div
            key={plan.id}
            className={`relative rounded-lg border bg-card text-card-foreground p-8 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
              plan.popular ? 'ring-1 ring-primary/20' : ''
            }`}
            aria-label={`${plan.name} plan`}
          >
            {plan.popular && (
              <div className="absolute top-3 right-3">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                  Most popular
                </span>
              </div>
            )}

            <div className="flex items-center mb-4">
              <Icon className="h-8 w-8 text-primary mr-3" aria-hidden="true" />
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                {plan.price > 0 ? (
                  <span className="text-muted-foreground">/month</span>
                ) : (
                  <span className="text-muted-foreground">No credit card required</span>
                )}
              </div>
              {isPro && (
                <div className="text-xs text-muted-foreground mt-1">per month, cancel anytime</div>
              )}
            </div>

            <ul className="space-y-3 mb-8" role="list">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-500 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {isFree ? (
                <Link href="/sign-in" className="block w-full" aria-label="Get started with Free">
                  <Button variant={plan.buttonVariant || 'outline'} size="lg" className="w-full">
                    {plan.buttonText}
                  </Button>
                </Link>
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
                    amount: plan.price * 100,
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
