"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Sparkles, Crown } from "lucide-react";

async function startAutumnCheckout() {
  try {
    const res = await fetch('/api/autumn/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    if (data.provider === 'stripe' && data.sessionId) {
      const { getStripe } = await import('@/lib/stripe-client');
      const stripe = await getStripe();
      if (stripe) await stripe.redirectToCheckout({ sessionId: data.sessionId });
      return;
    }
  } catch (e) {
    console.error('Checkout failed', e);
  }
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <Zap className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">ZapDev Pricing</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the full power of AI-assisted React development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-2">
                <Sparkles className="h-8 w-8 text-yellow-500" />
              </div>
              <CardTitle>AI-Powered Development</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat with AI agents to build React applications with advanced features and real-time code generation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle>Isolated Sandboxes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Each project runs in its own secure E2B sandbox environment with persistent file storage.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-2">
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle>Autonomous Execution</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced autonomous workflows that can execute complex development tasks independently.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-500 ml-1">forever</span>
              </div>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />5 chats</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Basic models</li>
              </ul>
              <Button variant="outline" className="w-full">Get Started</Button>
            </CardContent>
          </Card>

          <Card className="relative border-blue-500 ring-2 ring-blue-500">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">Pro</CardTitle>
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">$20</span>
                <span className="text-gray-500 ml-1">per month</span>
              </div>
              <CardDescription>For builders who want more</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Unlimited chats</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Advanced models</li>
              </ul>
              <Button className="w-full" onClick={startAutumnCheckout}>Upgrade to Pro</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-amber-50 border-amber-200 mb-8">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Usage-Based Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-800">
            <p className="mb-4">ZapDev uses a usage-based model to ensure you only pay for what you use.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
