import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { verifyWebhookSignature, POLAR_CONFIG } from "@/lib/polar";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("polar-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      signature,
      POLAR_CONFIG.webhookSecret
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    console.log("Polar webhook received:", event.type);

    // Handle different webhook events
    switch (event.type) {
      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionUpdate(event.data);
        break;

      case "subscription.canceled":
      case "subscription.revoked":
        await handleSubscriptionCanceled(event.data);
        break;

      case "subscription.active":
        await handleSubscriptionActivated(event.data);
        break;

      case "customer.created":
      case "customer.updated":
        await handleCustomerUpdate(event.data);
        break;

      default:
        console.log("Unhandled webhook event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const customerId = subscription.customerId || subscription.customer_id;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  console.log("Updating subscription:", { customerId, subscriptionId, status });

  try {
    // Update user's subscription in Convex
    await fetchMutation(api.users.updateSubscription as any, {
      polarCustomerId: customerId,
      subscriptionId,
      subscriptionStatus: status,
      plan: ["active", "trialing"].includes(status) ? "pro" : "free",
    });
  } catch (error) {
    console.error("Failed to update subscription in Convex:", error);
    throw error;
  }
}

async function handleSubscriptionCanceled(subscription: any) {
  const customerId = subscription.customerId || subscription.customer_id;
  const subscriptionId = subscription.id;

  console.log("Canceling subscription:", { customerId, subscriptionId });

  try {
    await fetchMutation(api.users.updateSubscription as any, {
      polarCustomerId: customerId,
      subscriptionId,
      subscriptionStatus: "canceled",
      plan: "free",
    });
  } catch (error) {
    console.error("Failed to cancel subscription in Convex:", error);
    throw error;
  }
}

async function handleSubscriptionActivated(subscription: any) {
  const customerId = subscription.customerId || subscription.customer_id;
  const subscriptionId = subscription.id;

  console.log("Activating subscription:", { customerId, subscriptionId });

  try {
    await fetchMutation(api.users.updateSubscription as any, {
      polarCustomerId: customerId,
      subscriptionId,
      subscriptionStatus: "active",
      plan: "pro",
    });
  } catch (error) {
    console.error("Failed to activate subscription in Convex:", error);
    throw error;
  }
}

async function handleCustomerUpdate(customer: any) {
  console.log("Customer updated:", customer.id);
  // Handle customer updates if needed
}
