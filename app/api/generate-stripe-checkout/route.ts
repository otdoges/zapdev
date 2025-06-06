import { getAuth, currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { type NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  const user = await currentUser();

  if (!userId || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let stripeCustomerId = await convex.query(api.stripe.getStripeCustomerId, { clerkId: userId });

  if (!stripeCustomerId) {
    const newCustomer = await stripe.customers.create({
      email: user.primaryEmailAddress?.emailAddress,
      metadata: {
        userId: userId,
      },
    });
    
    stripeCustomerId = newCustomer.id;
    await convex.mutation(api.stripe.setStripeCustomerId, {
      clerkId: userId,
      stripeCustomerId,
    });
  }

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/success`;
  const checkout = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    success_url: successUrl,
    line_items: [
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