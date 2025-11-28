"use client";

import { ReactNode, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";
import { useAccessToken } from "@workos-inc/authkit-nextjs/components";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useWorkOSAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}

function useWorkOSAuth() {
  const { accessToken, loading, refresh } = useAccessToken();

  return useMemo(
    () => ({
      isLoading: loading,
      isAuthenticated: !!accessToken,
      fetchAccessToken: async ({
        forceRefreshToken,
      }: {
        forceRefreshToken: boolean;
      }) => {
        if (!accessToken && !forceRefreshToken) return null;
        if (forceRefreshToken) await refresh();
        return accessToken ?? null;
      },
    }),
    [accessToken, loading]
  );
}
