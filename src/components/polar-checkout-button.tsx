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

      const { data, error } = await authClient.checkout({
        products: [productId],
      });

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to create checkout session", {
          description: error.message || "Please try again later.",
        });
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }

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
