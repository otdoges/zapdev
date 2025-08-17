import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  console.warn("⚠️  Missing Convex URL - Database will be disabled");
  console.log("💡 To enable database:");
  console.log("   1. Get a Convex deployment URL from: https://dashboard.convex.dev");
  console.log("   2. Add VITE_CONVEX_URL=https://your-app.convex.cloud to .env.local");
  console.log("   3. Restart the development server");
}

// Create a mock client for development when URL is missing
export const convex = convexUrl 
  ? new ConvexReactClient(convexUrl)
  : new ConvexReactClient("https://mock-convex-url.convex.cloud"); // Mock URL for development