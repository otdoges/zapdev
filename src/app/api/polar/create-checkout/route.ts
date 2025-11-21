import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/stack-auth";
import { getPolarClient } from "@/lib/polar";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user with Stack Auth
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to continue" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Missing productId" },
        { status: 400 }
      );
    }

    const polar = getPolarClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Create checkout
    // We pass userId in metadata so we can link subscription to user in webhook
    const checkout = await polar.checkouts.create({
      productId,
      successUrl: `${appUrl}/dashboard?checkout=success`,
      customerEmail: user.primaryEmail || undefined,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Error creating Polar checkout session:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
