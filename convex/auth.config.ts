// Better Auth integration with Convex
// Better Auth uses JWT tokens for session management
// Configure the JWT verification for Convex auth
export default {
  providers: [
    {
      // Better Auth will issue JWTs that Convex will verify
      // The domain should match your app URL
      domain: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      applicationID: "zapdev",
    },
  ]
};
