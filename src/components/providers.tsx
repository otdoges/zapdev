"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { AutumnProvider } from "autumn-js/react";

import { Toaster } from "@/components/ui/sonner";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const convexAutumnApi = api.autumn;

export function Providers({ children }: { children: React.ReactNode }) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <AutumnProvider convex={convex} convexApi={convexAutumnApi}>
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
      </AutumnProvider>
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
