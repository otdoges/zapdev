import { NextRequest, NextResponse } from "next/server";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { fetchMutation, fetchQuery } from "convex/nextjs";

import { api } from "@/convex/_generated/api";
import { getPolarWebhookSecret } from "@/lib/polar-client";
import {
  buildSubscriptionIdempotencyKey,
  extractUserIdFromMetadata,
  sanitizeSubscriptionMetadata,
} from "@/lib/subscription-metadata";

type PolarSubscriptionPayload = {
  id?: string;
  status?: string;
  customerId?: string;
  customer?: { id?: string; metadata?: unknown };
  productId?: string;
  product?: { id?: string; name?: string };
  productName?: string;
  metadata?: unknown;
  currentPeriodStart?: string | number;
  current_period_start?: string | number;
  currentPeriodEnd?: string | number;
  current_period_end?: string | number;
  cancelAtPeriodEnd?: boolean;
  cancel_at_period_end?: boolean;
  updatedAt?: string | number;
  updated_at?: string | number;
};

type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid";

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeStatus(status: unknown): SubscriptionStatus {
  switch (String(status ?? "").toLowerCase()) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    default:
      return "incomplete";
  }
}

async function upsertSubscription(
  data: PolarSubscriptionPayload,
  userId: string,
) {
  const metadata = sanitizeSubscriptionMetadata(
    data.metadata ?? data.customer?.metadata ?? {},
  );

  await fetchMutation(api.subscriptions.createOrUpdateSubscription, {
    userId,
    polarCustomerId: data.customerId || data.customer?.id || "",
    polarSubscriptionId: data.id || "",
    productId: data.productId || data.product?.id || "",
    productName: data.productName || data.product?.name || "Pro",
    status: normalizeStatus(data.status),
    currentPeriodStart: toTimestamp(
      data.currentPeriodStart ?? data.current_period_start ?? Date.now(),
    ),
    currentPeriodEnd: toTimestamp(
      data.currentPeriodEnd ?? data.current_period_end ?? Date.now(),
    ),
    cancelAtPeriodEnd:
      data.cancelAtPeriodEnd ?? data.cancel_at_period_end ?? false,
    metadata,
  });
}

async function markCancellation(polarSubscriptionId: string) {
  await fetchMutation(api.subscriptions.markSubscriptionForCancellation, {
    polarSubscriptionId,
  });
}

async function revokeSubscription(polarSubscriptionId: string) {
  await fetchMutation(api.subscriptions.revokeSubscription, {
    polarSubscriptionId,
  });
}

async function reactivateSubscription(polarSubscriptionId: string) {
  await fetchMutation(api.subscriptions.reactivateSubscription, {
    polarSubscriptionId,
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("webhook-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing webhook signature" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let parsedEvent: Record<string, unknown>;
  try {
    const verified = validateEvent(rawBody, signature, getPolarWebhookSecret());
    parsedEvent = toObject(
      typeof verified === "string" ? JSON.parse(verified) : verified,
    );
  } catch (error) {
    console.error("Polar webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const eventType = String(parsedEvent.type ?? parsedEvent.event ?? "").trim();
  const data = toObject(parsedEvent.data);
  const subscription = data as PolarSubscriptionPayload;

  const subscriptionId = subscription.id;
  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Subscription ID missing from webhook payload" },
      { status: 400 },
    );
  }

  const updatedAt =
    subscription.updatedAt ?? subscription.updated_at ?? Date.now();

  const idempotencyKey = buildSubscriptionIdempotencyKey({
    id: subscriptionId,
    updatedAt,
    status: subscription.status || "",
  });

  const duplicate = await fetchQuery(api.webhookEvents.isDuplicate, {
    idempotencyKey,
  });
  if (duplicate) {
    return NextResponse.json({ success: true, duplicate: true });
  }

  await fetchMutation(api.webhookEvents.recordProcessedEvent, {
    idempotencyKey,
    provider: "polar",
    eventType: eventType || "unknown",
  });

  const metadataResult = extractUserIdFromMetadata(
    subscription.metadata ?? subscription.customer?.metadata ?? {},
  );
  const userId = metadataResult.userId;

  if (!userId) {
    console.warn(
      `[Polar webhook] Missing userId in metadata for subscription ${subscriptionId}`,
    );
    return NextResponse.json(
      { error: "User metadata missing in subscription payload" },
      { status: 422 },
    );
  }

  try {
    switch (eventType) {
      case "subscription.created":
      case "subscription.active":
      case "subscription.updated":
        await upsertSubscription(subscription, userId);
        break;
      case "subscription.uncanceled":
        await upsertSubscription(subscription, userId);
        await reactivateSubscription(subscriptionId);
        break;
      case "subscription.canceled":
        await markCancellation(subscriptionId);
        break;
      case "subscription.revoked":
        await revokeSubscription(subscriptionId);
        break;
      default:
        // Unhandled events are acknowledged for idempotency
        break;
    }
  } catch (error) {
    console.error("Error processing Polar webhook:", error);
    return NextResponse.json(
      { error: "Failed to sync subscription data" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
