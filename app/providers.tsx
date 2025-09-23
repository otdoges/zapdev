"use client";

import { ConvexProviderWithAuthKit } from "@convex-dev/workos";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuthKit>
      {children}
    </ConvexProviderWithAuthKit>
  );
}