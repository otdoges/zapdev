import { NextRequest, NextResponse } from "next/server";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getPolarClient } from "@/lib/polar";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const requestBody = await req.text();
  const webhookHeaders: Record<string, string> = {};
  
  req.headers.forEach((value, key) => {
    webhookHeaders[key] = value;
  });

  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("POLAR_WEBHOOK_SECRET is missing");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  let event;
  try {
    event = validateEvent(requestBody, webhookHeaders, webhookSecret);
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.active": {
        const subscription = event.data;
        const userId = subscription.metadata?.userId as string | undefined;

        if (!userId) {
          console.warn(`Subscription ${subscription.id} missing userId in metadata`);
          return NextResponse.json({ received: true });
        }

        // Try to get product name from payload or fetch it
        let productName = (subscription as any).product?.name;
        
        if (!productName) {
          try {
            const polar = getPolarClient();
            // Polar SDK types might differ, but usually there's a way to get product
            const product = await polar.products.get({ id: subscription.product_id });
            productName = product.name;
          } catch (e) {
            console.error("Failed to fetch product details", e);
            productName = "Subscription";
          }
        }

        // Map Polar status to Convex status
        let status: "incomplete" | "active" | "canceled" | "past_due" | "unpaid" = "active";
        const s = subscription.status;
        
        if (["active", "trialing"].includes(s)) status = "active";
        else if (["incomplete"].includes(s)) status = "incomplete";
        else if (["past_due"].includes(s)) status = "past_due";
        else if (["canceled", "incomplete_expired"].includes(s)) status = "canceled";
        else if (["unpaid"].includes(s)) status = "unpaid";

        await convex.mutation(api.subscriptions.createOrUpdateSubscription, {
          userId: userId,
          polarCustomerId: subscription.customer_id,
          polarSubscriptionId: subscription.id,
          productId: subscription.product_id,
          productName: productName,
          status: status,
          currentPeriodStart: new Date(subscription.current_period_start).getTime(),
          currentPeriodEnd: new Date(subscription.current_period_end).getTime(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          metadata: subscription.metadata,
        });
        break;
      }

      case "subscription.revoked":
        await convex.mutation(api.subscriptions.revokeSubscription, {
          polarSubscriptionId: event.data.id,
        });
        break;

      case "subscription.canceled":
        await convex.mutation(api.subscriptions.markSubscriptionForCancellation, {
          polarSubscriptionId: event.data.id,
        });
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
