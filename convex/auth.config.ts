// Stack Auth + Convex Integration
// This file configures Stack Auth as the authentication provider for Convex
// Configuration manually constructed based on Stack Auth's getConvexProvidersConfig()
// See: node_modules/@stackframe/stack/dist/integrations/convex.js

const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";

export default {
  providers: [
    {
      domain: baseUrl,
      applicationID: "convex",
    },
  ],
};

