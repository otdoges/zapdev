"use client";

import { ReactNode, useEffect } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { useStackApp } from "@stackframe/stack";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const stackApp = useStackApp();
  
  useEffect(() => {
    // Set Stack Auth authentication for Convex
    convex.setAuth(
      stackApp.getConvexClientAuth({
        tokenStore: "nextjs-cookie",
      })
    );
  }, [stackApp]);

  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
