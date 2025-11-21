"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";

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
  const user = useUser();

  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated
      if (!user) {
        toast.error("Please sign in to continue", {
          description: "You need to be signed in to purchase a subscription.",
        });
        setIsLoading(false);
        // Redirect to sign in page
        window.location.href = "/handler/sign-in";
        return;
      }

        // Call our API to create a Polar checkout session
        const response = await fetch("/api/polar/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            userId: user.id,
          }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorMessage =
            typeof payload?.error === "string"
              ? payload.error
              : "Failed to create checkout session";
          const description =
            typeof payload?.details === "string"
              ? payload.details
              : "Please try again later.";

          toast.error(errorMessage, { description });

          if (typeof payload?.adminMessage === "string") {
            console.error("🔧 Polar checkout admin message:", payload.adminMessage);
          }
          return;
        }

        if (payload?.url) {
          window.location.href = payload.url as string;
          return;
        }

        toast.error("Unable to start checkout", {
          description: "Polar did not return a checkout URL. Please try again.",
        });
      } catch (error) {
        console.error("Checkout error:", error);
        toast.error("Unable to start checkout", {
          description: error instanceof Error ? error.message : "Please try again later.",
        });
      } finally {
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
