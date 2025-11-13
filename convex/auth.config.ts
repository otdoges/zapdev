// Stack Auth + Convex Integration
// This file configures Stack Auth as the authentication provider for Convex

export default {
  providers: [
    {
      domain: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      applicationID: "convex",
    },
  ],
};
