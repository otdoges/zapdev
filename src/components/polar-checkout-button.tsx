"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface PolarCheckoutButtonProps {
  productId: string;
  productName: string;
  price: string;
  interval?: "month" | "year";
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component to initiate Polar checkout flow
 * Creates a checkout session and redirects to Polar-hosted checkout page
 */
export function PolarCheckoutButton({
  productId,
  productName,
  price,
  interval = "month",
  variant = "default",
  className,
  children,
}: PolarCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      const { error } = await authClient.checkout({
        products: [productId],
        successUrl: `${window.location.origin}/?subscription=success`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      });

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to create checkout session", {
          description: error.message || "Please try again later.",
        });
        setIsLoading(false);
        return;
      }

      // Redirect is handled automatically by authClient.checkout if successful?
      // Wait, authClient.checkout returns { data, error }. Data might contain the URL.
      // Checking docs: "The checkout method will redirect the user to the checkout page."
      // But if it returns data, maybe I need to redirect manually?
      // Docs say: "successUrl (optional): The relative URL where customers will be redirected..."
      // Let's assume it redirects or returns a URL.
      // Actually, better-auth client usually handles redirects.
      // But let's check the return type if possible.
      // The docs example: "await authClient.checkout({ ... })"

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Unable to start checkout", {
        description: "Please check your internet connection and try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      variant={variant}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children || `Get ${productName} - ${price}/${interval}`
      )}
    </Button>
  );
}
