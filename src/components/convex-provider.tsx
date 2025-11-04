"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import type { ReactNode } from "react";

let convexClient: ConvexReactClient | null = null;

function getConvexClient() {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }
    convexClient = new ConvexReactClient(url);
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
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
