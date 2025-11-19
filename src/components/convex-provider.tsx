"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      return new ConvexReactClient("https://placeholder.convex.cloud");
    }
    return new ConvexReactClient(url);
  }, []);

  return (
    <ConvexProviderWithAuth
      client={convex}
      useAuth={() => {
        const { data: session, isPending } = authClient.useSession();
        return {
          isLoading: isPending,
          isAuthenticated: !!session,
          fetchAccessToken: async ({ forceRefreshToken }) => {
            try {
              const response = await fetch("/api/convex-auth");
              if (!response.ok) {
                return null;
              }
              const { token } = await response.json();
              return token;
            } catch (error) {
              return null;
            }
          },
        };
      }}
    >
      {children}
    </ConvexProviderWithAuth>
  );
}
