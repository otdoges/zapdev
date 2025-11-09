import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import type { WebhookEvent } from "@clerk/backend";

import { convex } from "@/inngest/convex-client";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status });

const isRelevantEvent = (eventType: string): boolean => {
  return (
    eventType.startsWith("subscriptionItem.") ||
    eventType.startsWith("subscription.")
  );
};

const resolveUserIdFromEvent = (event: WebhookEvent): string | null => {
  const data: Record<string, unknown> = event.data as Record<string, unknown>;

  if (event.type.startsWith("subscriptionItem.")) {
    const payer = data?.payer as { user_id?: string } | undefined;
    return payer?.user_id ?? null;
  }

  if (event.type.startsWith("subscription.")) {
    const payerId = (data?.payer_id ?? data?.payerId) as string | undefined;
    if (payerId) {
      return payerId;
    }

    const payer = data?.payer as { user_id?: string } | undefined;
    return payer?.user_id ?? null;
  }

  return null;
};

const selectPrimarySubscriptionItem = (
  items: Array<{
    id: string;
    status: string;
    planPeriod?: string | null;
    plan?: {
      id: string;
      slug: string;
      name: string;
      features?: Array<{ slug?: string | null }>;
    } | null;
    planId?: string | null;
    amount?: { amount: number; currency: string } | null;
    periodStart?: number | null;
    periodEnd?: number | null;
    isFreeTrial?: boolean;
  }>
) => {
  const priorityStatuses = new Set(["active", "upcoming", "past_due"]);
  const prioritized = items.find((item) => priorityStatuses.has(item.status));
  return prioritized ?? items[0] ?? null;
};

export async function POST(request: NextRequest) {
  const secret = process.env.CLERK_BILLING_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[clerk-webhook] Missing CLERK_BILLING_WEBHOOK_SECRET");
    return jsonResponse({ error: "Server misconfiguration" }, 500);
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return jsonResponse({ error: "Missing Svix signature headers" }, 400);
  }

  const payload = await request.text();
  const headers = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  };

  let event: WebhookEvent;

  try {
    const webhook = new Webhook(secret);
    event = webhook.verify(payload, headers) as WebhookEvent;
  } catch (error) {
    console.error("[clerk-webhook] Signature verification failed", error);
    return jsonResponse({ error: "Invalid signature" }, 401);
  }

  if (!isRelevantEvent(event.type)) {
    return jsonResponse({ ok: true, ignored: event.type });
  }

  const userId = resolveUserIdFromEvent(event);
  if (!userId) {
    console.warn("[clerk-webhook] Unable to resolve user id", {
      eventType: event.type,
    });
    return jsonResponse({ ok: true, ignored: "missing_user" });
  }

  try {
    const subscription = await clerkClient.billing.getUserBillingSubscription(userId);

    const primaryItem = selectPrimarySubscriptionItem(subscription.subscriptionItems);

    if (!primaryItem) {
      await convex.mutation(api.billing.clearUserSubscription, { userId });
      return jsonResponse({ ok: true, cleared: true });
    }

    const features = primaryItem.plan?.features
      ?.map((feature) => feature.slug)
      .filter((slug): slug is string => Boolean(slug)) ?? [];

    const snapshot = {
      subscriptionId: subscription.id,
      subscriptionItemId: primaryItem.id,
      subscriptionStatus: subscription.status,
      planId: primaryItem.plan?.id ?? primaryItem.planId ?? null,
      planSlug: primaryItem.plan?.slug ?? null,
      planName: primaryItem.plan?.name ?? null,
      planPeriod: primaryItem.planPeriod ?? null,
      planAmountCents: primaryItem.amount?.amount ?? null,
      currency: primaryItem.amount?.currency ?? null,
      features,
      trialStartedAt: primaryItem.isFreeTrial ? primaryItem.periodStart ?? null : null,
      trialEndsAt: primaryItem.isFreeTrial ? primaryItem.periodEnd ?? null : null,
      isTrialActive: Boolean(primaryItem.isFreeTrial),
      lastWebhookEvent: event.type,
    };

    await convex.mutation(api.billing.upsertUserSubscription, {
      userId,
      snapshot,
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    const maybeStatus =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined;

    if (maybeStatus === 404) {
      await convex.mutation(api.billing.clearUserSubscription, { userId });
      return jsonResponse({ ok: true, cleared: true, reason: "not_found" });
    }

    console.error("[clerk-webhook] Failed to sync billing", error);
    return jsonResponse({ error: "Failed to sync billing" }, 500);
  }
}
