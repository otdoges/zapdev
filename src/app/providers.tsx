"use client";

import React, { useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!mounted || !publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
  );
}
