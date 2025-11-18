import { NextRequest, NextResponse } from "next/server";
import { getPolarClient, getPolarOrganizationId, isPolarConfigured } from "@/lib/polar-client";
import { getUser } from "@/lib/auth-server";
import { getSanitizedErrorDetails } from "@/lib/env-validation";

/**
 * Create a Polar checkout session
 * Authenticates user and creates a checkout URL for the specified product
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Polar is configured
    if (!isPolarConfigured()) {
      console.error('❌ Polar is not properly configured');
      return NextResponse.json(
        { 
          error: "Payment system is not configured",
          details: "Please contact support. Configuration issue detected.",
          isConfigError: true
        },
        { status: 503 } // Service Unavailable
      );
    }

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

    // Check for environment mismatch
    const isProduction = process.env.NODE_ENV === "production";
    // Polar production IDs start with "prod_", sandbox IDs are UUIDs
    const isProdId = typeof productId === 'string' && productId.startsWith("prod_");
    
    /*
     * NOTE: We allow sandbox IDs in production environment for testing/staging builds.
     * The Polar client will automatically switch to sandbox mode if a non-prod ID is detected.
     * 
    if (isProduction && !isProdId) {
       console.error("❌ Configuration mismatch: Using sandbox ID in production");
       return NextResponse.json(
           { 
               error: "Configuration mismatch", 
               details: "Using a sandbox product ID in production environment.",
               isConfigError: true 
           },
           { status: 400 }
       );
    }
    
    if (!isProduction && isProdId) {
       console.error("❌ Configuration mismatch: Using production ID in sandbox");
       return NextResponse.json(
           { 
               error: "Configuration mismatch", 
               details: "Using a production product ID in sandbox environment.",
               isConfigError: true 
           },
           { status: 400 }
       );
    }
    */

    const organizationId = getPolarOrganizationId();

    // Create checkout session with Polar
    const polar = getPolarClient();
    const checkout = await polar.checkouts.create({
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
      const errorMessage = error.message;
      const sanitizedError = getSanitizedErrorDetails(error);
      
      // Check for authentication/authorization errors
      if (errorMessage.includes('401') || errorMessage.includes('invalid_token') || errorMessage.includes('expired')) {
        console.error('❌ Polar token is invalid or expired');
        return NextResponse.json(
          { 
            error: "Payment system authentication failed",
            details: "The payment service token has expired. Please contact support.",
            isConfigError: true,
            adminMessage: "POLAR_ACCESS_TOKEN is invalid or expired. Regenerate in Polar.sh dashboard and update in Vercel environment variables."
          },
          { status: 503 }
        );
      }
      
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        console.error('❌ Polar access forbidden');
        return NextResponse.json(
          { 
            error: "Payment system access denied",
            details: "Insufficient permissions. Please contact support.",
            isConfigError: true,
            adminMessage: "Check Polar organization permissions for the access token."
          },
          { status: 503 }
        );
      }
      
      if (errorMessage.includes('404')) {
        console.error('❌ Polar resource not found');
        return NextResponse.json(
          { 
            error: "Product not found",
            details: "The requested product is not available. Please try again or contact support.",
            isConfigError: true,
            adminMessage: "Check NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID and ensure the product exists in Polar.sh dashboard."
          },
          { status: 404 }
        );
      }

      if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        console.error('❌ Polar bad request');
        return NextResponse.json(
            {
                error: "Invalid request",
                details: "The payment provider rejected the request.",
                isConfigError: true,
                adminMessage: "Check that the Product ID matches the environment (Sandbox vs Production)."
            },
            { status: 400 }
        );
      }
      
      // Generic error with sanitized details
      return NextResponse.json(
        { 
          error: "Failed to create checkout session",
          details: sanitizedError
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
