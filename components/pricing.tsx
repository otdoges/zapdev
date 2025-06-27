'use client';

import {
  CheckIcon,
  StarIcon,
  ZapIcon,
  ShieldIcon,
  HeadphonesIcon,
  BarChart3Icon,
  TrendingUpIcon,
  UsersIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProductWithPrices } from '@/lib/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PricingContentProps {
  products: ProductWithPrices[];
}

export function PricingContent({ products }: PricingContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });
      const { url } = await res.json();
      if (url) {
        router.push(url);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center text-white">
          <h2 className="mb-4 text-2xl font-bold">Loading pricing...</h2>
          <p className="text-gray-400">No products available at this moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-10 top-20 h-72 w-72 animate-pulse rounded-full bg-purple-500 opacity-10 mix-blend-multiply blur-xl filter"></div>
        <div
          className="absolute right-10 top-40 h-72 w-72 animate-pulse rounded-full bg-pink-500 opacity-10 mix-blend-multiply blur-xl filter"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute bottom-20 left-1/2 h-72 w-72 animate-pulse rounded-full bg-blue-500 opacity-10 mix-blend-multiply blur-xl filter"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-6 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-6xl font-bold text-transparent duration-1000 animate-in fade-in slide-in-from-bottom-8">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-300 delay-300 duration-1000 animate-in fade-in slide-in-from-bottom-4">
            Choose the perfect plan for your AI development journey. All plans include our core
            features with no hidden fees.
          </p>

          {/* Social Proof */}
          <div className="mt-8 flex items-center justify-center space-x-8 delay-700 duration-1000 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <UsersIcon className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-300">10,000+ Happy Users</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-300">99.9% Uptime</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldIcon className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-300">SOC 2 Certified</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="monthly" className="mx-auto w-full max-w-7xl">
          <TabsList className="mx-auto mb-12 grid h-12 w-[350px] grid-cols-2 border border-slate-700 bg-slate-800/50 delay-500 duration-1000 animate-in slide-in-from-bottom-4">
            <TabsTrigger
              value="monthly"
              className="transition-all duration-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" disabled className="opacity-50">
              Yearly (Coming Soon)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-8">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => {
                const price = product.prices[0];
                if (!price) return null;

                return (
                  <Card
                    key={product.id}
                    className={`group relative flex flex-col border-2 bg-slate-900/50 text-white backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl ${
                      product.metadata?.popularPlan
                        ? 'border-purple-500 bg-gradient-to-b from-purple-900/20 to-slate-900/50 shadow-lg shadow-purple-500/25'
                        : 'border-slate-700 hover:border-slate-600'
                    } duration-1000 animate-in slide-in-from-bottom-8`}
                    style={{
                      animationDelay: `${(index + 1) * 200}ms`,
                    }}
                  >
                    {product.metadata?.highlight && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <Badge
                          className={`${
                            product.metadata?.popularPlan
                              ? 'animate-pulse bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                              : 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                          } px-4 py-1 text-sm font-medium shadow-lg`}
                        >
                          {product.metadata.highlight}
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className={`${product.metadata?.highlight ? 'pt-8' : 'pt-6'} pb-4`}>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 transition-transform duration-300 group-hover:scale-110">
                          <ZapIcon className="h-8 w-8 text-blue-500" />
                          <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-lg leading-relaxed text-gray-300">
                        {product.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 pt-0">
                      <div className="mb-8">
                        <div className="flex items-baseline space-x-2">
                          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-5xl font-bold text-transparent transition-transform duration-300 group-hover:scale-110">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency! }).format((price.unit_amount || 0) / 100)}
                          </span>
                          <span className="ml-2 text-lg text-gray-400">/month</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-400">Billed monthly, cancel anytime</p>
                      </div>

                      <ul className="space-y-4">
                        {(product.metadata?.features as string[] || []).map((feature, featureIndex) => (
                          <li
                            key={`${product.id}-${featureIndex}`}
                            className="flex items-start space-x-3"
                          >
                            <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                            <span className="leading-relaxed text-gray-200">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="pt-6">
                      <Button
                        onClick={() => handleCheckout(price.id)}
                        disabled={loading}
                        className={`h-12 w-full text-lg font-semibold transition-all duration-500 ${
                          product.metadata?.popularPlan
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                            : 'border border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {loading ? 'Processing...' : `Get Started with ${product.name}`}
                        {!loading && <ArrowRightIcon className="ml-2 h-4 w-4" />}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>

            {/* Features Comparison */}
            <div className="mt-20 text-center delay-1000 duration-1000 animate-in fade-in slide-in-from-bottom-8">
              <h3 className="mb-8 text-2xl font-bold text-white">All plans include</h3>
              <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  {
                    icon: HeadphonesIcon,
                    title: 'Expert Support',
                    desc: 'Get help from our AI experts whenever you need it',
                    color: 'blue',
                  },
                  {
                    icon: ShieldIcon,
                    title: 'Enterprise Security',
                    desc: 'Bank-level security for all your AI projects',
                    color: 'green',
                  },
                  {
                    icon: BarChart3Icon,
                    title: 'Advanced Analytics',
                    desc: 'Track your AI usage and optimize performance',
                    color: 'purple',
                  },
                ].map((feature, index) => (
                  <div
                    key={feature.title}
                    className={`flex flex-col items-center rounded-lg border border-slate-700 bg-slate-800/30 p-6 transition-all duration-1000 duration-300 animate-in slide-in-from-bottom-4 hover:scale-105 hover:bg-slate-800/50`}
                    style={{ animationDelay: `${1200 + index * 200}ms` }}
                  >
                    <feature.icon
                      className={`h-8 w-8 text-${feature.color}-400 mb-3 transition-transform duration-300 hover:scale-110`}
                    />
                    <h4 className="mb-2 font-semibold text-white">{feature.title}</h4>
                    <p className="text-center text-sm text-gray-400">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Portal Link */}
            <div className="delay-1400 mt-16 rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-800/50 to-purple-800/20 p-8 text-center transition-all duration-1000 duration-500 animate-in fade-in slide-in-from-bottom-4 hover:border-purple-500/50">
              <h3 className="mb-4 text-xl font-semibold text-white">
                Already have a subscription?
              </h3>
              <p className="mb-6 text-gray-300">
                Manage your account, view usage, and update billing information.
              </p>
              <Button
                variant="outline"
                className="border-purple-500 px-8 py-3 text-purple-300 transition-all duration-300 hover:scale-105 hover:bg-purple-500 hover:text-white active:scale-95"
                asChild
              >
                <a href="/api/polar/portal" className="flex items-center">
                  <ShieldIcon className="mr-2 h-4 w-4" />
                  Manage Subscription
                  <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="delay-1600 mt-20 text-center duration-1000 animate-in fade-in">
          <p className="text-gray-400">
            Questions? Contact our team at{' '}
            <a
              href="mailto:support@zapdev.com"
              className="text-purple-400 transition-colors hover:text-purple-300 hover:underline"
            >
              support@zapdev.com
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: animate-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function Pricing() {
  // This is a fallback for when the page is rendered without props
  // It should not happen in the normal flow, but it's a good safety measure
  const staticPlans: ProductWithPrices[] = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for getting started',
      prices: [{ id: 'price_1', unit_amount: 900, currency: 'USD' }],
      metadata: {
        features: ['1,000 AI generations per month', 'Basic templates', 'Community support'],
        popularPlan: true,
        highlight: 'Great Start',
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Best for professionals',
      prices: [{ id: 'price_2', unit_amount: 2900, currency: 'USD' }],
      metadata: {
        features: [
          '10,000 AI generations per month',
          'Premium templates',
          'Priority support',
          'API access',
        ],
        popularPlan: true,
        highlight: 'Most Popular',
      },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large teams',
      prices: [{ id: 'price_3', unit_amount: 9900, currency: 'USD' }],
      metadata: {
        features: ['Unlimited generations', 'Custom templates', '24/7 support', 'Advanced API'],
        highlight: 'Full Power',
      },
    },
  ];

  return <PricingContent products={staticPlans} />;
}
