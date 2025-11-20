import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ConvexHttpClient } from "convex/browser";
import { signConvexJWT } from "@/lib/convex-auth";

export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user;
}

export async function getConvexClientWithAuth(userId: string) {
  const token = await signConvexJWT({ sub: userId });
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  client.setAuth(token);
  return client;
}

