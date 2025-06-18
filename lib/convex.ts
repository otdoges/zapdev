import { ConvexReactClient } from "convex/react";

// Create a Convex client with defensive initialization
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is required in production. " +
      "Check your deployment secrets / environment variables."
    );
  }
  console.warn(
    "NEXT_PUBLIC_CONVEX_URL not found, using placeholder for development."
  );
 }

export const convex = new ConvexReactClient(
  convexUrl || "https://placeholder.convex.cloud"
); 