import { NextRequest, NextResponse } from "next/server";
import { polarClient, getPolarOrganizationId } from "@/lib/polar-client";
import { getUser } from "@/lib/auth-server";

/**
 * Create a Polar checkout session
 * Authenticates user and creates a checkout URL for the specified product
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user via Stack Auth
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Parse request body
    const { productId, successUrl, cancelUrl } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const organizationId = getPolarOrganizationId();

    // Create checkout session with Polar
    const checkout = await polarClient.checkouts.create({
      // Products array (can include multiple product IDs)
      products: [productId],
      // Pass user ID in metadata to link subscription to Stack Auth user
      metadata: {
        userId: user.id,
        userEmail: user.primaryEmail || "",
      },
      customerEmail: user.primaryEmail || undefined,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      // Allow customer to return to pricing page if they cancel
      // Polar will handle the redirect automatically
    });

    // Return checkout URL for redirect
    return NextResponse.json({
      checkoutId: checkout.id,
      url: checkout.url,
    });
  } catch (error) {
    console.error("Checkout creation error:", error);
    
    // Handle specific Polar API errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
