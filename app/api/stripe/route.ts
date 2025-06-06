import { stripe, allowedEvents, syncStripeDataToKV } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

async function processEvent(event: Stripe.Event) {
  if (!allowedEvents.includes(event.type)) return;

  const { customer: customerId } = event?.data?.object as {
    customer: string;
  };

  if (typeof customerId !== "string") {
    throw new Error(
      `[STRIPE HOOK] Customer ID is not a string.\nEvent type: ${event.type}`
    );
  }

  return await syncStripeDataToKV(customerId);
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") ?? "";

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    await processEvent(event);

  } catch (error) {
    console.error("[STRIPE HOOK] Error processing event", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  return NextResponse.json({ received: true });
} 