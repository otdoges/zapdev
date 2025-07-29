export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://clerk.dev",
      applicationID: "convex",
    },
  ],
};