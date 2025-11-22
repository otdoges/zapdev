"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";
import { stackClientApp } from "@/stack/client";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      // During build time or if env is missing, provide a fallback or throw a clear error
      if (typeof window === "undefined") {
        // SSR/Build fallback
        return new ConvexReactClient("https://placeholder.convex.cloud");
      }
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }
    
    const client = new ConvexReactClient(convexUrl);
    
    // Set up authentication using the stackClientApp
    client.setAuth(
      stackClientApp.getConvexClientAuth({ tokenStore: "nextjs-cookie" })
    );
    
    return client;
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
