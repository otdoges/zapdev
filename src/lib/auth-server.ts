import { createAuth } from "@/convex/auth";
import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";
import { headers } from "next/headers";

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

