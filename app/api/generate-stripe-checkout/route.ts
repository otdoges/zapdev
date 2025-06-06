import { getAuth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { stripe } from "@/lib/stripe";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  const user = await currentUser();

  if (!userId || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get the stripeCustomerId from your KV store
  let stripeCustomerId = await kv.get<string>(`stripe:user:${userId}`);

  // Create a new Stripe customer if this user doesn't have one
  if (!stripeCustomerId) {
    const newCustomer = await stripe.customers.create({
      email: user.primaryEmailAddress?.emailAddress,
      metadata: {
        userId: userId, // DO NOT FORGET THIS
      },
    });

    // Store the relation between userId and stripeCustomerId in your KV
    await kv.set(`stripe:user:${userId}`, newCustomer.id);
    stripeCustomerId = newCustomer.id;
  }

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/success`;
  // ALWAYS create a checkout with a stripeCustomerId. They should enforce this.
  const checkout = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    success_url: successUrl,
    line_items: [
        // replace this with your price id
        { price: "price_1...", quantity: 1 },
    ],
    mode: "subscription"
  });

  if (!checkout.url) {
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(checkout.url);
} 