import { NextRequest, NextResponse } from "next/server";

import { getUser } from "@/lib/stack-auth";
import {
  getPolarClient,
  getPolarOrganizationId,
  getPolarProProductId,
  isPolarConfigured,
} from "@/lib/polar-client";
import { getSanitizedErrorDetails, validatePolarEnv } from "@/lib/env-validation";

type CheckoutRequest = {
  productId?: string;
  successUrl?: string;
  cancelUrl?: string;
};

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}

function buildResponse(
  status: number,
  payload: {
    error: string;
    details?: string;
    isConfigError?: boolean;
    adminMessage?: string;
  },
) {
  return NextResponse.json(payload, { status });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return buildResponse(401, {
        error: "Unauthorized",
        details: "Please sign in to continue",
      });
    }

    if (!isPolarConfigured()) {
      return buildResponse(503, {
        error: "Payment system is not configured",
        details: "Please contact support while we finish setting up billing.",
        isConfigError: true,
        adminMessage: "Missing Polar environment variables. Run validatePolarEnv() for details.",
      });
    }

    const body = (await req.json().catch(() => ({}))) as CheckoutRequest;
    const requestedProductId = body.productId?.trim();

    let productId = requestedProductId ?? "";
    if (!productId) {
      try {
        productId = getPolarProProductId();
      } catch {
        return buildResponse(503, {
          error: "Polar product is not configured",
          details: "Set NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID to your Polar product ID.",
          isConfigError: true,
          adminMessage: "NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID is missing",
        });
      }
    }
    if (!productId) {
      return buildResponse(500, {
        error: "Unable to determine Polar product",
        details: "Product ID resolution failed unexpectedly.",
        adminMessage: "Polar product ID empty after configuration check",
      });
    }

      validatePolarEnv(true);
      const polar = getPolarClient();

      const baseUrl = getBaseUrl();
      const successUrl =
        body.successUrl || `${baseUrl}/dashboard/subscription?status=success`;
      const cancelUrl =
        body.cancelUrl || `${baseUrl}/dashboard/subscription?status=cancelled`;

      const checkout = await polar.checkoutSessions.create({
        organizationId: getPolarOrganizationId(),
        productPriceId: productId,
        successUrl,
        cancelUrl,
        customerEmail: user.primaryEmail ?? undefined,
        customerName: user.name ?? undefined,
        metadata: {
          userId: user.id,
          userEmail: user.primaryEmail ?? undefined,
        },
      });

    if (!checkout?.url) {
      throw new Error("Polar checkout session did not include a redirect URL");
    }

    return NextResponse.json({
      checkoutId: checkout.id,
      url: checkout.url,
    });
  } catch (error) {
    const details = getSanitizedErrorDetails(error);
    const adminMessage =
      error instanceof Error ? error.message : "Unknown Polar checkout error";

    console.error("Error creating Polar checkout session:", error);

    const isAuthError =
      typeof details === "string" &&
      (details.includes("Authentication failed") ||
        details.includes("invalid or expired"));

    const status = isAuthError ? 401 : 500;

    return buildResponse(status, {
      error: "Unable to start checkout",
      details,
      adminMessage,
    });
  }
}
