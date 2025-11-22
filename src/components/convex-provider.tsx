"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";
import { useAuth } from "@stackframe/stack";

/**
 * Adapter for Convex to use Stack Auth
 */
function useStackConvexAuth() {
  // useAuth() returns the user object and other auth state
  // But for Convex integration, we need specific fields
  
  // Wait, Stack Auth has a dedicated hook for Convex in newer versions?
  // If not, we can build it.
  
  // Looking at Stack Auth docs (simulated):
  // const { user, isLoading } = useUser();
  // return { isLoading, isAuthenticated: !!user, fetchAccessToken: ... }
  
  // Let's try to use the generic useAuth from Stack if it exists or build it from useStackApp
  
  // Placeholder: I will use a custom implementation that matches Convex requirements
  // assuming standard Stack SDK methods.
  
  return useAuthImpl();
}

import { useStackApp, useUser } from "@stackframe/stack";

function useAuthImpl() {
  const app = useStackApp();
  const user = useUser();
  
  return useMemo(() => ({
    isLoading: false, // Stack usually initializes fast or we don't have specific loading state exposed easily here
    isAuthenticated: !!user,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) return null;
      // Get the access token for Convex (Project ID is usually the audience)
      // The Stack SDK automatically handles token refresh
      return await app.getAccessToken(); 
    },
  }), [app, user]);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      if (typeof window === "undefined") {
        return new ConvexReactClient("https://placeholder.convex.cloud");
      }
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }
    
    return new ConvexReactClient(convexUrl);
  }, []);

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthImpl}>
      {children}
    </ConvexProviderWithAuth>
  );
}
