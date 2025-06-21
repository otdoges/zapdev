import { Checkout } from "@polar-sh/nextjs";
import { NextRequest, NextResponse } from "next/server";

// Check if Polar is properly configured
const accessToken = process.env.POLAR_ACCESS_TOKEN;
const server = (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";

// Enhanced checkout with error handling
export async function GET(request: NextRequest) {
  if (!accessToken) {
    console.error("POLAR_ACCESS_TOKEN is not configured");
    return NextResponse.json(
      { error: "Payment system not configured. Please contact support." },
      { status: 500 }
    );
  }

  try {
    console.log("Polar checkout request:", {
      accessToken: accessToken ? "***configured***" : "missing",
      server,
      successUrl: process.env.POLAR_SUCCESS_URL || `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/success`,
      searchParams: Object.fromEntries(request.nextUrl.searchParams)
    });

    // Create the checkout handler
    const checkoutHandler = Checkout({
      accessToken,
      successUrl: process.env.POLAR_SUCCESS_URL || `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/success`,
      server,
    });

    return await checkoutHandler(request);
  } catch (error) {
    console.error("Polar checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 