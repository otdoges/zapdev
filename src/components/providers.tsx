"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Toaster />
        <WebVitalsReporter />
        {children}
      </ThemeProvider>
    </ConvexProviderWithClerk>
  );

  return clerkPublishableKey ? (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#C96342",
        },
      }}
    >
      {content}
    </ClerkProvider>
  ) : (
    content
  );
}
