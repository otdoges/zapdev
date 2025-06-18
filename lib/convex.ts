import { ConvexReactClient } from "convex/react";

// Validate that the Convex URL is properly configured
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL in your environment variables. " +
    "Please check your .env.local file and make sure you have set up your Convex deployment. " +
    "Run 'bunx convex dev' to get your deployment URL."
  );
}

if (!convexUrl.startsWith('https://')) {
  throw new Error(
    "NEXT_PUBLIC_CONVEX_URL must be a valid HTTPS URL from your Convex deployment. " +
    "It should look like: https://your-project-name.convex.cloud"
  );
}

// Create a Convex client
export const convex = new ConvexReactClient(convexUrl); 