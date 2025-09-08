"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown } from "lucide-react";
import CheckoutButton from "@/components/stripe/CheckoutButton";

export default function PricingPage() {
  const router = useRouter();
  const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro_monthly";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Choose the plan that fits your workflow. Start free and upgrade
            anytime.
          </p>
        </header>

        <section aria-labelledby="pricing-heading" className="mb-16">
          <h2 id="pricing-heading" className="sr-only">
            Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free */}
            <Card className="transition hover:shadow-md hover:scale-[1.01] focus-within:ring-2 focus-within:ring-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Free</CardTitle>
                      <CardDescription>
                        Everything you need to get started.
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-sm text-muted-foreground">No credit card required</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3" role="list">
                  {[
                    "Up to 5 chats",
                    "Basic templates",
                    "Standard sandbox time",
                    "Community support",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" aria-hidden="true" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    aria-label="Get started with Free"
                    onClick={() => router.push("/sign-in")}
                  >
                    Get started
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="relative transition hover:shadow-md hover:scale-[1.01] ring-1 ring-primary/20">
              <span className="absolute top-3 right-3 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Most popular
              </span>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Crown className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Pro</CardTitle>
                      <CardDescription>
                        Build without limits with advanced AI.
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-sm text-muted-foreground">per month, cancel anytime</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3" role="list">
                  {[
                    "Unlimited chats",
                    "Advanced AI models",
                    "Extended sandbox time",
                    "Priority support",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" aria-hidden="true" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <CheckoutButton
                    priceId={proPriceId}
                    mode="subscription"
                    variant="orange"
                    size="lg"
                    className="w-full"
                  >
                    Upgrade to Pro
                  </CheckoutButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle id="faq-heading">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">What happens if I exceed my limits?</h3>
                  <p className="text-sm text-muted-foreground">
                    When you reach your plan limits, you can upgrade instantly to continue working. Your projects and progress are always preserved.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Can I change plans anytime?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes. You can upgrade or downgrade at any time. Changes take effect immediately and billing is prorated.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Do I need a credit card for Free?</h3>
                  <p className="text-sm text-muted-foreground">
                    No. The Free plan requires no credit card and is great for getting started.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
