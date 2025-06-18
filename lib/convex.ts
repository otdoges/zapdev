import { ConvexReactClient } from "convex/react";

// Create a Convex client
export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
); 