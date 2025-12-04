import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Get this from Clerk Dashboard -> JWT Templates -> Convex template
      // Copy the Issuer URL from your "convex" JWT template
      // Format: https://verb-noun-00.clerk.accounts.dev (dev)
      //         https://clerk.<your-domain>.com (prod)
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
