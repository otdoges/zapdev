// Better Auth + Convex Integration
// This file configures Better Auth as the authentication provider for Convex
// Configuration manually constructed based on Better Auth's integration patterns

const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";

export default {
  providers: [
    {
      domain: baseUrl,
      applicationID: "convex",
    },
  ],
};

