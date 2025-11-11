import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-server";
import { createCheckoutSession, getOrCreateCustomer, polar } from "@/lib/polar";
import { fetchMutation, fetchQuery } from "convex/nextjs";
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

    const userEmail = session.user.email;
    const userName = session.user.name || undefined;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required to create a Polar checkout session" },
        { status: 422 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Application URL not configured" },
        { status: 500 }
      );
    }

    const existingStatus = await fetchQuery(
      api.users.getSubscriptionStatus,
      {
        userId: session.user.id,
      }
    );
    const previousPolarCustomerId = existingStatus?.polarCustomerId;
    const idempotencyKey = `polar-customer-${session.user.id}`;

    const customerResult = await getOrCreateCustomer({
      email: userEmail,
      name: userName,
      userId: session.user.id,
      idempotencyKey,
    });

    if (!customerResult.success || !customerResult.customer) {
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      );
    }

    const customer = customerResult.customer;
    const customerWasNew = customerResult.created ?? false;
    let linkApplied = false;

    const deleteNewCustomer = async (): Promise<string | null> => {
      if (!customerWasNew) {
        return null;
      }

      try {
        await polar.customers.delete({ id: customer.id });
        return null;
      } catch (cleanupError) {
        console.error(
          `Failed to delete Polar customer ${customer.id} during rollback:`,
          cleanupError
        );
        return "Failed to delete Polar customer during rollback";
      }
    };

    const rollbackConvexLink = async (): Promise<string | null> => {
      if (!linkApplied) {
        return null;
      }

      try {
        await fetchMutation(api.users.unlinkPolarCustomer, {
          userId: session.user.id,
          expectedPolarCustomerId: customer.id,
          restorePolarCustomerId: previousPolarCustomerId ?? undefined,
        });
        return null;
      } catch (cleanupError) {
        console.error(
          `Failed to rollback Polar link in Convex for user ${session.user.id}:`,
          cleanupError
        );
        return "Failed to rollback Convex link";
      }
    };

    try {
      await fetchMutation(api.users.linkPolarCustomer, {
        userId: session.user.id,
        polarCustomerId: customer.id,
      });
      linkApplied = true;
    } catch (linkError) {
      console.error(
        `Failed to link Polar customer ${customer.id} for user ${session.user.id}:`,
        linkError
      );
      const cleanupResults = await Promise.all([deleteNewCustomer()]);
      const cleanupMessages = cleanupResults.filter(
        (message): message is string => Boolean(message)
      );
      const responseBody: Record<string, string> = {
        error: "Failed to link Polar customer",
      };
      if (cleanupMessages.length > 0) {
        responseBody.cleanupError = cleanupMessages.join(" | ");
      }

      return NextResponse.json(responseBody, { status: 500 });
    }

    const checkoutResult = await createCheckoutSession({
      customerId: customer.id,
      customerEmail: userEmail,
      customerName: userName,
      productId,
      successUrl: successUrl || `${baseUrl}/dashboard`,
    });

    if (!checkoutResult.success || !checkoutResult.checkout) {
      const cleanupResults = await Promise.all([
        rollbackConvexLink(),
        deleteNewCustomer(),
      ]);
      const cleanupMessages = cleanupResults.filter(
        (message): message is string => Boolean(message)
      );
      const responseBody: Record<string, string> = {
        error: "Failed to create checkout session",
      };
      if (cleanupMessages.length > 0) {
        responseBody.cleanupError = cleanupMessages.join(" | ");
      }

      return NextResponse.json(responseBody, { status: 500 });
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
