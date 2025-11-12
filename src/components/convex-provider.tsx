"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";
import { useMemo } from "react";
import type { ReactNode } from "react";

let convexClient: ConvexReactClient | null = null;

function getConvexClient() {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }
    convexClient = new ConvexReactClient(url, {
      // Optionally pause queries until the user is authenticated
      // Set to false if you have public routes
      expectAuth: false,
    });
  }
  return convexClient;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      if (typeof window === "undefined") {
        return new ConvexReactClient("https://placeholder.convex.cloud");
      }
      console.error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
      return new ConvexReactClient("https://placeholder.convex.cloud");
    }
    return getConvexClient();
  }, []);

  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
