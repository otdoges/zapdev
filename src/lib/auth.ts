import { betterAuth } from "better-auth";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { nextCookies } from "better-auth/next-js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Inbound } from "@inboundemail/sdk";

// Environment variable validation
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw new Error("Missing required environment variables: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET");
}
if (!process.env.POLAR_ACCESS_TOKEN) {
    throw new Error("Missing required environment variable: POLAR_ACCESS_TOKEN");
}
if (!process.env.POLAR_WEBHOOK_SECRET) {
    throw new Error("Missing required environment variable: POLAR_WEBHOOK_SECRET");
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET");
}
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_CONVEX_URL");
}

const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
});

const inbound = new Inbound(process.env.INBOUND_API_KEY || "build_placeholder");

// Instantiate ConvexHttpClient once
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

type ConvexSubscriptionStatus = "incomplete" | "active" | "canceled" | "past_due" | "unpaid";

const POLAR_TO_CONVEX_STATUS: Record<string, ConvexSubscriptionStatus> = {
    "active": "active",
    "canceled": "canceled",
    "incomplete": "incomplete",
    "incomplete_expired": "canceled",
    "past_due": "past_due",
    "unpaid": "unpaid",
    "trialing": "active",
};

async function syncSubscriptionToConvex(subscription: any, resetUsage = false) {
    const userId = subscription.metadata?.userId as string;

    if (!userId) return;

    // Safe status mapping
    const status = POLAR_TO_CONVEX_STATUS[subscription.status] || "active";

    await convex.mutation(api.subscriptions.createOrUpdateSubscription, {
        userId,
        polarCustomerId: subscription.customerId,
        polarSubscriptionId: subscription.id,
        productId: subscription.productId,
        productName: subscription.product?.name || "Pro",
        status,
        currentPeriodStart: subscription.currentPeriodStart
            ? new Date(subscription.currentPeriodStart).getTime()
            : Date.now(),
        currentPeriodEnd: subscription.currentPeriodEnd
            ? new Date(subscription.currentPeriodEnd).getTime()
            : Date.now() + 30 * 24 * 60 * 60 * 1000,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        metadata: subscription.metadata,
    });

    if (resetUsage) {
        await convex.mutation(api.usage.resetUsage, { userId });
    }
}

export const auth = betterAuth({
    plugins: [
        nextCookies(),
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    // We will configure products dynamically or via environment variables if needed
                    // For now, we enable it to allow checkout sessions
                    authenticatedUsersOnly: true,
                    successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/?subscription=success`,
                    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`,
                }),
                portal(),
                usage(),
                webhooks({
                    secret: process.env.POLAR_WEBHOOK_SECRET,
                    onSubscriptionCreated: async (event) => {
                        await syncSubscriptionToConvex(event.data);
                    },
                    onSubscriptionUpdated: async (event) => {
                        await syncSubscriptionToConvex(event.data);
                    },
                    onSubscriptionActive: async (event) => {
                        await syncSubscriptionToConvex(event.data, true);
                    },
                    onSubscriptionCanceled: async (event) => {
                        const subscription = event.data;
                        await convex.mutation(api.subscriptions.markSubscriptionForCancellation, {
                            polarSubscriptionId: subscription.id,
                        });
                    },
                    onSubscriptionRevoked: async (event) => {
                        const subscription = event.data;
                        await convex.mutation(api.subscriptions.revokeSubscription, {
                            polarSubscriptionId: subscription.id,
                        });

                        const userId = subscription.metadata?.userId as string;
                        if (userId) {
                            await convex.mutation(api.usage.resetUsage, { userId });
                        }
                    },
                    onSubscriptionUncanceled: async (event) => {
                        const subscription = event.data;
                        await convex.mutation(api.subscriptions.reactivateSubscription, {
                            polarSubscriptionId: subscription.id,
                        });
                    }
                    // We can add specific handlers here later if needed
                }),
            ],
        }),
    ],
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendEmailVerification: async ({ user, url }: { user: { email: string }, url: string }) => {
            await inbound.emails.send({
                from: "noreply@zapdev.link",
                to: user.email,
                subject: "Verify your email address",
                html: `<p>Click the link below to verify your email address:</p><a href="${url}">${url}</a>`,
            });
        },
        sendResetPassword: async ({ user, url }: { user: { email: string }, url: string }) => {
            await inbound.emails.send({
                from: "noreply@zapdev.link",
                to: user.email,
                subject: "Reset your password",
                html: `<p>Click the link below to reset your password:</p><a href="${url}">${url}</a>`,
            });
        },
    }
});
