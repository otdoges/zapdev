"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

export function PricingPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!session) {
      router.push("/sign-in?redirect=/pricing");
      return;
    }

    setLoading(true);
    try {
      // Call API to create Polar checkout session
      const response = await fetch("/api/polar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
        }),
      });

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to start subscription process. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/polar/portal", {
        method: "POST",
      });

      const data = await response.json();
      
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        throw new Error("Failed to get portal URL");
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open customer portal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return ( 
    <div className="flex flex-col max-w-5xl mx-auto w-full px-4">
      <section className="space-y-8 pt-[16vh] 2xl:pt-48 pb-16">
        <div className="flex flex-col items-center space-y-4">
          <Image 
            src="/logo.svg"
            alt="ZapDev - AI Development Platform"
            width={50}
            height={50}
            className="hidden md:block"
          />
          <h1 className="text-3xl md:text-5xl font-bold text-center">Pricing</h1>
          <p className="text-muted-foreground text-center text-base md:text-lg max-w-2xl">
            Choose the plan that fits your needs. Start free and upgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for trying out ZapDev</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>5 AI generations per day</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>All frameworks (Next.js, React, Angular, Vue, Svelte)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Live preview in isolated sandbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Code export</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Community support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push(session ? "/dashboard" : "/sign-up")}
              >
                {session ? "Go to Dashboard" : "Get Started"}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="border-primary shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <CardDescription>For serious developers</CardDescription>
                </div>
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
                  POPULAR
                </span>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">100 AI generations per day</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Everything in Free, plus:</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Priority AI processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Advanced code optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Figma & GitHub imports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Priority email support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {session ? (
                <>
                  <Button 
                    className="w-full" 
                    onClick={handleSubscribe}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Subscribe to Pro"}
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="ghost"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={loading}
                  >
                    Manage Subscription
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => router.push("/sign-up?redirect=/pricing")}
                >
                  Sign Up for Pro
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>All plans include access to our AI-powered development platform.</p>
          <p className="mt-2">Cancel anytime. No hidden fees.</p>
        </div>
      </section>
    </div>
   );
}