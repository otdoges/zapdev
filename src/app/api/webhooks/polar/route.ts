import { NextRequest, NextResponse } from "next/server";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getPolarWebhookSecret } from "@/lib/polar-client";

/**
 * Polar.sh Webhook Handler
 * Handles subscription lifecycle events and syncs to Convex
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    
    // Convert Next.js headers to plain object for validateEvent
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Verify webhook signature
    let event;
    try {
      const secret = getPolarWebhookSecret();
      event = validateEvent(body, headers, secret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    console.log("Polar webhook event received:", event.type);

    // Handle different webhook events
    switch (event.type) {
      case "subscription.created":
      case "subscription.active":
      case "subscription.updated": {
        const subscription = event.data;
        
        // Extract user ID from metadata (passed during checkout)
        const userId = subscription.metadata?.userId as string;
        if (!userId) {
          console.error("Missing userId in subscription metadata");
          return NextResponse.json(
            { error: "Missing userId in metadata" },
            { status: 400 }
          );
        }

        // Determine product name from subscription
        const productName = subscription.product?.name || "Pro";

        // Sync subscription to Convex
        await convex.mutation(api.subscriptions.createOrUpdateSubscription, {
          userId,
          polarCustomerId: subscription.customerId,
          polarSubscriptionId: subscription.id,
          productId: subscription.productId,
          productName,
          status: subscription.status as any,
          currentPeriodStart: subscription.currentPeriodStart 
            ? new Date(subscription.currentPeriodStart).getTime() 
            : Date.now(),
          currentPeriodEnd: subscription.currentPeriodEnd 
            ? new Date(subscription.currentPeriodEnd).getTime() 
            : Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now as fallback
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
          metadata: subscription.metadata,
        });

        // Update usage credits based on subscription status
        if (subscription.status === "active") {
          // Grant Pro credits (100/day)
          await convex.mutation(api.usage.resetUsage, {
            userId,
          });
        }

        console.log(`Subscription ${event.type} processed for user ${userId}`);
        break;
      }

      case "subscription.canceled": {
        const subscription = event.data;
        
        // Mark subscription for cancellation (end of period)
        await convex.mutation(api.subscriptions.markSubscriptionForCancellation, {
          polarSubscriptionId: subscription.id,
        });

        console.log(`Subscription marked for cancellation: ${subscription.id}`);
        break;
      }

      case "subscription.revoked": {
        const subscription = event.data;
        
        // Immediately revoke subscription
        await convex.mutation(api.subscriptions.revokeSubscription, {
          polarSubscriptionId: subscription.id,
        });

        // Reset to free tier credits
        const userId = subscription.metadata?.userId as string;
        if (userId) {
          await convex.mutation(api.usage.resetUsage, {
            userId,
          });
        }

        console.log(`Subscription revoked: ${subscription.id}`);
        break;
      }

      case "subscription.uncanceled": {
        const subscription = event.data;
        
        // Reactivate subscription
        await convex.mutation(api.subscriptions.reactivateSubscription, {
          polarSubscriptionId: subscription.id,
        });

        console.log(`Subscription reactivated: ${subscription.id}`);
        break;
      }

      case "order.created": {
        const order = event.data;
        
        // Log renewal events
        if (order.billingReason === "subscription_cycle") {
          console.log(`Subscription renewal for customer ${order.customerId}`);
        }
        break;
      }

      case "customer.created":
      case "customer.updated":
      case "customer.deleted": {
        // Log customer events for debugging
        console.log(`Customer event: ${event.type}`, event.data.id);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // Return 200 OK to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Disable body parsing to get raw body for signature verification
export const runtime = "nodejs";
