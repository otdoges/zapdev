import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-server";
import { getCustomerPortalUrl } from "@/lib/polar";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST() {
  try {
    const session = await requireSession();

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's subscription status from Convex
    const subscriptionStatus = await fetchQuery(
      api.users.getSubscriptionStatus as any,
      {
        userId: session.user.id,
      }
    );

    if (!subscriptionStatus || !subscriptionStatus.polarCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Get customer portal URL
    const portalResult = await getCustomerPortalUrl(
      subscriptionStatus.polarCustomerId
    );

    if (!portalResult.success || !portalResult.url) {
      return NextResponse.json(
        { error: "Failed to create portal session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      portalUrl: portalResult.url,
    });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to get portal URL" },
      { status: 500 }
    );
  }
}
