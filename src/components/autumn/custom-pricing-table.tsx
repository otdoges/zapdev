'use client';

import React, { useState } from "react";
import { useCustomer, usePricingTable, type ProductDetails } from "autumn-js/react";
import type { Product, ProductItem } from "autumn-js";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getPricingTableContent } from "@/lib/autumn/pricing-table-content";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";

interface CustomPricingTableProps {
  productDetails?: ProductDetails[];
  className?: string;
}

export default function CustomPricingTable({ productDetails, className }: CustomPricingTableProps) {
  const { customer, checkout } = useCustomer({ errorOnNotFound: false });
  const [isAnnual, setIsAnnual] = useState(false);
  const { products, isLoading, error } = usePricingTable({ productDetails });

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Unable to load pricing plans</p>
          <p className="text-sm text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  // Check if we have multiple intervals (monthly/annual)
  const intervalGroups = products
    .map((p) => p.properties?.interval_group)
    .filter((intervalGroup): intervalGroup is string => Boolean(intervalGroup));
  const intervals = Array.from(new Set(intervalGroups));
  const multiInterval = intervals.length > 1;

  // Filter products based on selected interval
  const intervalFilter = (product: Product) => {
    if (!product.properties?.interval_group) {
      return true;
    }

    if (multiInterval) {
      if (isAnnual) {
        return product.properties?.interval_group === "year";
      } else {
        return product.properties?.interval_group === "month";
      }
    }

    return true;
  };

  const filteredProducts = products.filter(intervalFilter);
  const hasRecommended = filteredProducts.some((p) => p.display?.recommend_text);

  return (
    <div className={cn("w-full", className)}>
      {/* Annual/Monthly Toggle */}
      {multiInterval && (
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-secondary/50 border">
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                !isAnnual
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all relative",
                isAnnual
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual
              <Badge className="ml-2 bg-green-500 text-white border-0 text-[10px] py-0 px-1.5">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className={cn(
        "grid gap-8 max-w-7xl mx-auto",
        filteredProducts.length === 0 && "grid-cols-1 max-w-md",
        filteredProducts.length === 1 && "grid-cols-1 md:grid-cols-2",
        filteredProducts.length === 2 && "grid-cols-1 md:grid-cols-3",
        filteredProducts.length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        <FreePlanCard />
        {filteredProducts.map((product, index) => (
          <PricingCard
            key={product.id ?? index}
            product={product}
            customer={customer}
            checkout={checkout}
            isRecommended={hasRecommended && Boolean(product.display?.recommend_text)}
          />
        ))}
      </div>
    </div>
  );
}

function FreePlanCard() {
  return (
    <div className="relative flex flex-col rounded-2xl border bg-card transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="flex-1 p-8 space-y-6">
        {/* Plan Name & Description */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Free</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            Perfect for trying out ZapDev
          </p>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">$0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-3 pt-6 border-t">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Check className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium leading-tight">5 generations daily</p>
                <p className="text-xs text-muted-foreground">Resets every 24 hours</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Check className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium leading-tight">All frameworks</p>
                <p className="text-xs text-muted-foreground">Next.js, React, Vue, Angular, Svelte</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Check className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium leading-tight">Real-time preview</p>
                <p className="text-xs text-muted-foreground">Live sandbox environment</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Button */}
      <div className="p-8 pt-0">
        <Button
          variant="outline"
          className="w-full h-11 text-base font-semibold transition-all"
          disabled
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Current Plan
          </span>
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          Your current plan
        </p>
      </div>
    </div>
  );
}

interface PricingCardProps {
  product: Product;
  customer: any;
  checkout: any;
  isRecommended: boolean;
}

function PricingCard({ product, customer, checkout, isRecommended }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const { buttonText } = getPricingTableContent(product);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (product.id && customer) {
        // Get checkout data and redirect to Stripe
        const { data, error } = await checkout({
          productId: product.id,
        });

        if (error) {
          console.error("Checkout error:", error);
          return;
        }

        // Redirect to Stripe checkout URL if available
        if (data?.url) {
          window.location.href = data.url;
        }
      } else if (product.display?.button_url) {
        window.open(product.display?.button_url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    loading ||
    (product.scenario === "active" && !product.properties.updateable) ||
    product.scenario === "scheduled";

  // Get main price
  const mainPriceDisplay = product.properties?.is_free
    ? {
        primary_text: "Free",
        secondary_text: "",
      }
    : product.items?.[0]?.display ?? {
        primary_text: "Custom",
        secondary_text: "",
      };

  // Get features (skip first item if it's the price)
  const featureItems = product.properties?.is_free
    ? product.items ?? []
    : (product.items?.length ?? 0) > 1
      ? product.items.slice(1)
      : [];

  // Determine if this is the current plan
  const isCurrentPlan = product.scenario === "active";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card transition-all duration-300",
        isRecommended && [
          "md:scale-105 shadow-xl border-primary/50",
          "bg-gradient-to-b from-primary/5 to-card"
        ],
        !isRecommended && "shadow-sm hover:shadow-md",
        isCurrentPlan && "ring-2 ring-primary/20"
      )}
    >
      {/* Recommended Badge */}
      {isRecommended && product.display?.recommend_text && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-lg px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            {product.display.recommend_text}
          </Badge>
        </div>
      )}

      <div className="flex-1 p-8 space-y-6">
        {/* Plan Name & Description */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">
            {product.display?.name || product.name}
          </h3>
          {product.display?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.display.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            {mainPriceDisplay.primary_text && (
              <span className="text-4xl font-bold tracking-tight">
                {mainPriceDisplay.primary_text}
              </span>
            )}
            {mainPriceDisplay.secondary_text && (
              <span className="text-muted-foreground">
                {mainPriceDisplay.secondary_text}
              </span>
            )}
          </div>
        </div>

        {/* Features List */}
        {featureItems.length > 0 && (
          <div className="space-y-3 pt-6 border-t">
            {product.display?.everything_from && (
              <p className="text-sm text-muted-foreground mb-3">
                Everything from {product.display.everything_from}, plus:
              </p>
            )}
            <ul className="space-y-3">
              {featureItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center",
                      isRecommended
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium leading-tight">
                      {item.display?.primary_text}
                    </p>
                    {item.display?.secondary_text && (
                      <p className="text-xs text-muted-foreground">
                        {item.display.secondary_text}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="p-8 pt-0">
        <Button
          onClick={handleClick}
          disabled={isDisabled}
          className={cn(
            "w-full h-11 text-base font-semibold transition-all group",
            isRecommended && "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl",
            isCurrentPlan && "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          )}
          variant={isRecommended ? "default" : isCurrentPlan ? "secondary" : "outline"}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              {isCurrentPlan && <Check className="w-4 h-4" />}
              {product.display?.button_text || buttonText}
              {isRecommended && !isCurrentPlan && (
                <Zap className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </span>
          )}
        </Button>

        {isCurrentPlan && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            Your current plan
          </p>
        )}
      </div>
    </div>
  );
}
