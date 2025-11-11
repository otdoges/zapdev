import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-server";
import { createCheckoutSession, getOrCreateCustomer, POLAR_CONFIG } from "@/lib/polar";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(request: Request) {
  try {
    const session = await requireSession();

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, successUrl } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get or create Polar customer
    const customerResult = await getOrCreateCustomer({
      email: session.user.email!,
      name: session.user.name || undefined,
      userId: session.user.id,
    });

    if (!customerResult.success || !customerResult.customer) {
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      );
    }

    const customer = customerResult.customer;

    // Link Polar customer ID to user in Convex
    await fetchMutation(api.users.linkPolarCustomer as any, {
      userId: session.user.id,
      polarCustomerId: customer.id,
    });

    // Create checkout session
    const checkoutResult = await createCheckoutSession({
      customerId: customer.id,
      customerEmail: session.user.email!,
      customerName: session.user.name || undefined,
      productId,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    if (!checkoutResult.success || !checkoutResult.checkout) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl: checkoutResult.checkout.url,
      checkoutId: checkoutResult.checkout.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
