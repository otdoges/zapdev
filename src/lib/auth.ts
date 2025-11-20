import { betterAuth } from "better-auth";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { nextCookies } from "better-auth/next-js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Inbound } from "@inboundemail/sdk";
import type * as SentryType from "@sentry/nextjs";
import {
    buildSubscriptionIdempotencyKey,
    extractUserIdFromMetadata,
    sanitizeSubscriptionMetadata,
    toSafeTimestamp,
} from "./subscription-metadata";

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
if (!process.env.INBOUND_API_KEY) {
    throw new Error("Missing required environment variable: INBOUND_API_KEY");
}

const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
});

const inbound = new Inbound(process.env.INBOUND_API_KEY);

// Instantiate ConvexHttpClient once
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

let sentry: typeof SentryType | null = null;

async function getSentry() {
    if (sentry !== null) {
        return sentry;
    }

    try {
        const mod = await import("@sentry/nextjs");
        sentry = mod;
        return mod;
    } catch {
        sentry = null;
        return null;
    }
}

async function captureException(error: unknown, context?: Record<string, unknown>) {
    const Sentry = await getSentry();
    if (Sentry?.captureException) {
        Sentry.captureException(error, { extra: context });
    }
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;
const processedWebhookEvents = new Map<string, number>();

const getAppUrl = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (process.env.NODE_ENV === "production") {
        if (!appUrl) {
            throw new Error("NEXT_PUBLIC_APP_URL must be set in production environment");
        }
        if (!appUrl.startsWith("https://")) {
            throw new Error(`NEXT_PUBLIC_APP_URL must use HTTPS in production. Got: ${appUrl}`);
        }
        return appUrl;
    }

    return appUrl || "https://zapdev.link";
};

type ConvexSubscriptionStatus = "incomplete" | "active" | "canceled" | "past_due" | "unpaid";

const POLAR_TO_CONVEX_STATUS: Partial<Record<string, ConvexSubscriptionStatus>> = {
    "active": "active",
    "canceled": "canceled",
    "incomplete": "incomplete",
    "incomplete_expired": "canceled",
    "past_due": "past_due",
    "unpaid": "unpaid",
    "trialing": "active",
};

function isDuplicateDelivery(key: string) {
    if (!key) return false;

    const now = Date.now();
    for (const [k, timestamp] of processedWebhookEvents) {
        if (timestamp + IDEMPOTENCY_TTL_MS < now) {
            processedWebhookEvents.delete(k);
        }
    }

    if (processedWebhookEvents.has(key)) {
        return true;
    }

    processedWebhookEvents.set(key, now);
    return false;
}

async function syncSubscriptionToConvex(subscription: any, resetUsage = false) {
    const payload = subscription ?? {};
    const { metadata, userId } = extractUserIdFromMetadata(payload.metadata);

    if (!userId) {
        const error = new Error(`Skipping Convex sync: missing or invalid userId in metadata. SubscriptionId: ${payload.id}`);
        console.error(error.message, { metadata });
        await captureException(error, { metadata, subscriptionId: payload?.id });
        return { success: false, reason: "missing-user-id" };
    }

    const subscriptionId = typeof payload.id === "string" && payload.id.trim() !== "" ? payload.id.trim() : "";
    const customerId = typeof payload.customerId === "string" && payload.customerId.trim() !== "" ? payload.customerId.trim() : "";
    const productId = typeof payload.productId === "string" && payload.productId.trim() !== "" ? payload.productId.trim() : "";
    const statusKey = typeof payload.status === "string" ? payload.status : "";

    const missingFields = [
        !subscriptionId && "id",
        !customerId && "customerId",
        !productId && "productId",
        !statusKey && "status",
    ].filter(Boolean) as string[];

    if (missingFields.length) {
        console.error("Skipping Convex sync: subscription missing critical fields", {
            missingFields,
            subscription: payload,
        });
        return { success: false };
    }

    const idempotencyKey = buildSubscriptionIdempotencyKey(payload);
    if (isDuplicateDelivery(idempotencyKey)) {
        console.info("Skipping duplicate Polar webhook delivery", {
            userId,
            subscriptionId,
            idempotencyKey,
        });
        return { success: true, duplicate: true };
    }

    const mappedStatus = POLAR_TO_CONVEX_STATUS[statusKey];
    if (!mappedStatus) {
        console.error("Unhandled Polar subscription status during Convex sync", {
            statusKey,
            subscriptionId,
            metadata,
            customerId,
            payload,
        });
        throw new Error(
            `Unhandled Polar subscription status "${statusKey}" for subscription ${subscriptionId || "<missing id>"}`
        );
    }

    const status = mappedStatus as ConvexSubscriptionStatus;
    const now = Date.now();
    const currentPeriodStart = toSafeTimestamp(payload.currentPeriodStart, now);
    const currentPeriodEnd = toSafeTimestamp(payload.currentPeriodEnd, now + THIRTY_DAYS_MS);
    const productName =
        typeof payload.product?.name === "string" && payload.product.name.trim() !== ""
            ? payload.product.name.trim()
            : "Pro";
    const cancelAtPeriodEnd = Boolean(payload.cancelAtPeriodEnd);

    try {
        await convex.mutation(api.subscriptions.createOrUpdateSubscription, {
            userId,
            polarCustomerId: customerId,
            polarSubscriptionId: subscriptionId,
            productId,
            productName,
            status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd,
            metadata,
        });

        if (resetUsage) {
            await convex.mutation(api.usage.resetUsage, { userId });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to sync subscription to Convex", {
            subscription: payload,
            error,
        });
        await captureException(error, {
            subscriptionId,
            userId,
            productId,
            idempotencyKey,
        });
        throw error;
    }
}

/**
 * Better Auth configuration
 */
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
                    successUrl: `${getAppUrl()}/?subscription=success`,
                    returnUrl: `${getAppUrl()}/pricing?canceled=true`,
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

                        const userId = subscription.metadata?.userId;
                        if (userId && typeof userId === "string" && userId.trim() !== "") {
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
            const contextMessage = `sendEmailVerification(${user.email}, ${url})`;
            try {
                await inbound.emails.send({
                    from: "noreply@zapdev.link",
                    to: user.email,
                    subject: "Verify your email address",
                    html: `<p>Click the link below to verify your email address:</p><a href="${url}">${url}</a>`,
                });
            } catch (error) {
                console.error(`${contextMessage} failed`, error);
                throw new Error(`${contextMessage} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        sendResetPassword: async ({ user, url }: { user: { email: string }, url: string }) => {
            const contextMessage = `sendResetPassword(${user.email}, ${url})`;
            try {
                await inbound.emails.send({
                    from: "noreply@zapdev.link",
                    to: user.email,
                    subject: "Reset your password",
                    html: `<p>Click the link below to reset your password:</p><a href="${url}">${url}</a>`,
                });
            } catch (error) {
                console.error(`${contextMessage} failed`, error);
                throw new Error(`${contextMessage} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
    }
});
