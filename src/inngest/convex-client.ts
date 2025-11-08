import { ConvexHttpClient } from "convex/browser";

let convexClient: ConvexHttpClient | null = null;

function getConvexClient() {
  if (convexClient) {
    return convexClient;
  }

  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }

  convexClient = new ConvexHttpClient(url);
  return convexClient;
}

export const convex = new Proxy({} as ConvexHttpClient, {
  get(_target, prop) {
    return getConvexClient()[prop as keyof ConvexHttpClient];
  },
});
