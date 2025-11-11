import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { verifyWebhookSignature, POLAR_CONFIG } from "@/lib/polar";

// Type definitions for Polar webhook payloads
interface PolarSubscription {
  id: string;
  customerId?: string;
  customer_id?: string;
  status: string;
  productId?: string;
  product_id?: string;
}

interface PolarCustomer {
  id: string;
  email: string;
  name?: string;
}

interface PolarWebhookEvent {
  id?: string; // Polar's event ID for idempotency
  type: string;
  data: PolarSubscription | PolarCustomer;
}

export async function POST(request: NextRequest) {
  let eventType: PolarWebhookEvent["type"] | undefined;
  let eventId: string | undefined;
  let webhookEventId: string | undefined;

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
    eventType = event.type;
    eventId = event.id || `${event.type}-${Date.now()}`;

    console.log("Polar webhook received:", eventType, { eventId });

    // Check if event already processed (idempotency)
    const existingEvent = await fetchQuery(
      api.webhookEvents.checkEvent,
      {
        provider: "polar",
        eventId: eventId,
      }
    );

    if (existingEvent) {
      console.log("Webhook event already processed:", eventId);
      // Return 200 for idempotent behavior
      return NextResponse.json({ received: true, idempotent: true });
    }

    // Create webhook event record
    webhookEventId = await fetchMutation(api.webhookEvents.create, {
      provider: "polar",
      eventId: eventId,
      eventType: eventType,
      payload: event,
    });

    // Mark as processing
    await fetchMutation(api.webhookEvents.markProcessing, {
      webhookEventId,
    });

    // Handle different webhook events
    switch (eventType) {
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
        console.log("Unhandled webhook event:", eventType);
    }

    // Mark event as completed
    if (webhookEventId) {
      await fetchMutation(api.webhookEvents.markCompleted, {
        webhookEventId,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", {
      type: eventType ?? "unknown",
      eventId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Mark event as failed if we have a webhook event ID
    if (webhookEventId) {
      try {
        await fetchMutation(api.webhookEvents.markFailed, {
          webhookEventId,
          error: error instanceof Error ? error.message : String(error),
          retryCount: 0,
        });
      } catch (markFailedError) {
        console.error("Failed to mark webhook event as failed:", markFailedError);
      }
    }

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: PolarSubscription) {
  const customerId = subscription.customerId || subscription.customer_id;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  if (!customerId) {
    throw new Error("Missing customer ID in subscription webhook");
  }

  console.log("Updating subscription:", { customerId, subscriptionId, status });

  try {
    // Update user's subscription in Convex
    await fetchMutation(api.users.updateSubscription, {
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

async function handleSubscriptionCanceled(subscription: PolarSubscription) {
  const customerId = subscription.customerId || subscription.customer_id;
  const subscriptionId = subscription.id;

  if (!customerId) {
    throw new Error("Missing customer ID in subscription webhook");
  }

  console.log("Canceling subscription:", { customerId, subscriptionId });

  try {
    await fetchMutation(api.users.updateSubscription, {
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

async function handleSubscriptionActivated(subscription: PolarSubscription) {
  const customerId = subscription.customerId || subscription.customer_id;
  const subscriptionId = subscription.id;

  if (!customerId) {
    throw new Error("Missing customer ID in subscription webhook");
  }

  console.log("Activating subscription:", { customerId, subscriptionId });

  try {
    await fetchMutation(api.users.updateSubscription, {
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

async function handleCustomerUpdate(customer: PolarCustomer) {
  console.log("Customer updated:", customer.id);
  // Handle customer updates if needed
}
