"use client";

import { StackProvider, StackClientApp } from "@stackframe/stack";
import { ReactNode } from "react";

// Create Stack client app - it will use NEXT_PUBLIC_STACK_* environment variables automatically
const stackApp = new StackClientApp();

export function StackProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <StackProvider app={stackApp}>
      {children}
    </StackProvider>
  );
}
