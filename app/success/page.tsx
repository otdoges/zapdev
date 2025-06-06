import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import { syncStripeDataToKV } from "@/lib/stripe";

export default async function SuccessPage() {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/");
  }

  const stripeCustomerId = await kv.get<string>(`stripe:user:${userId}`);
  if (!stripeCustomerId) {
    return redirect("/");
  }

  await syncStripeDataToKV(stripeCustomerId);

  // Redirect to a dashboard or home page
  return redirect("/");
} 