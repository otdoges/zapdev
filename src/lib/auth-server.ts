import { createAuth } from "@/convex/auth";
import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";

export const getToken = () => {
  return getTokenNextjs(createAuth);
};

// Helper to get current user from Better Auth
export async function getUser() {
  const { createAuth: createAuthInstance } = await import("@/convex/auth");
  const auth = createAuthInstance(undefined as any, { optionsOnly: true });
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user;
}

// Helper to get an authenticated Convex client
export async function getConvexClientWithAuth() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }

  const client = new ConvexHttpClient(url);
  const token = await getToken();

  if (token) {
    client.setAuth(token);
  }

  return client;
}

