import { auth } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
import { type NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = 'force-dynamic';

// Defensive Convex client creation
const createConvexClient = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL not found, using placeholder");
    return new ConvexHttpClient("https://placeholder.convex.cloud");
  }
  return new ConvexHttpClient(convexUrl);
};

const convex = createConvexClient();

// Map frontend price IDs to product names for easier lookup
const PRODUCT_MAP = {
  price_basic: "Basic Plan",
  price_pro: "Pro Plan",
  price_enterprise: "Enterprise Plan"
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { user } = session;

    // Get the priceId from the URL query parameters
    const url = new URL(req.url);
    const priceType = url.searchParams.get("priceId") || "price_pro"; // Default to pro if not specified
    
    const stripe = getStripeClient();

    // Get the product name from our map
    const productName = PRODUCT_MAP[priceType as keyof typeof PRODUCT_MAP] || "Pro Plan";
    
    // Fetch all prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 100,
    });
    
    // Find the price that matches our product name
    const price = prices.data.find(p => {
      const product = p.product as any;
      return product.name === productName && p.active;
    });
    
    if (!price) {
      throw new Error(`No active price found for product: ${productName}`);
    }
    
    // Create a customer directly in Stripe without requiring a user in Convex first
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
      },
    });

    // Now create the checkout session
    const successUrl = `${req.nextUrl.origin}/success?plan=${priceType}`;
    const cancelUrl = `${req.nextUrl.origin}/pricing`;

    const checkout = await stripe.checkout.sessions.create({
      customer: customer.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        { price: price.id, quantity: 1 },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      payment_method_types: ["card"],
      metadata: {
        userId: user.id,
        priceType,
        stripeCustomerId: customer.id
      }
    });

    if (!checkout.url) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.redirect(checkout.url);
  } catch (error) {
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to create checkout session", details: errorMessage },
      { status: 500 }
    );
  }
} 