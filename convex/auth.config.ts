// Stack Auth + Convex Integration
// This file configures Stack Auth as the authentication provider for Convex
// Using the official Stack Auth Convex integration

import { getConvexProvidersConfig } from "@stackframe/stack";

export default {
  providers: getConvexProvidersConfig({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  }),
};

