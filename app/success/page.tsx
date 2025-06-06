"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { syncStripeDataToConvex } from "@/lib/stripe";

export default function SuccessPage() {
  const { userId } = useAuth();
  const stripeCustomerId = useQuery(api.stripe.getStripeCustomerId, userId ? { clerkId: userId } : "skip");

  useEffect(() => {
    if (stripeCustomerId) {
      syncStripeDataToConvex(stripeCustomerId);
    }
  }, [stripeCustomerId]);
  
  if (!userId) {
    return redirect("/");
  }

  // You can add a loading state here while waiting for the redirect
  if (stripeCustomerId) {
    redirect("/");
  }

  return <div>Syncing your subscription...</div>;
} 