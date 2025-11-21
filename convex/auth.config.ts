// Better Auth + Convex Integration
// This file configures Better Auth as the authentication provider for Convex
// Using the official @convex-dev/better-auth component

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};

