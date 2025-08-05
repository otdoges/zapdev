export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://ideal-gopher-41.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};