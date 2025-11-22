"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";
import { useAuth, useAccessToken } from "@workos-inc/authkit-nextjs/components";

function useWorkOSConvexAuth() {
  const { user, loading } = useAuth();
  const { getAccessToken } = useAccessToken();
  
  return useMemo(() => ({
    isLoading: loading,
    isAuthenticated: !!user,
    // Always ask AuthKit for a fresh token so Convex receives a valid JWT
    fetchAccessToken: async () => {
      try {
        const token = await getAccessToken();
        console.log("ConvexProvider: Fetched token", { 
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : null 
        });
        return token ?? null;
      } catch (err) {
        console.error("ConvexProvider: Failed to fetch token", err);
        return null;
      }
    },
  }), [user, loading, getAccessToken]);
}

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
    
    return new ConvexReactClient(convexUrl);
  }, []);

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useWorkOSConvexAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
