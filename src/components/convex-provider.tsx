"use client";

import { useMemo, type ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }

  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!clerkPublishableKey) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is not set");
  }

  const proxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL;
  const clerkJSUrl =
    process.env.NEXT_PUBLIC_CLERK_JS_URL ??
    "https://clerk.clerk.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
  const useProxy = proxyUrl?.startsWith("/");

  const convex = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      clerkJSUrl={clerkJSUrl}
      {...(useProxy ? { proxyUrl } : {})}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
