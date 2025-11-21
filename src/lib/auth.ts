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
import { validatePassword } from "./password-validation";
import { passwordValidationPlugin } from "./password-validation-plugin";

// Lazy initialization of environment-dependent clients
// This prevents build-time crashes for routes that don't need auth

function validateEnvVar(name: string, value: string | undefined): string {
    if (!value || value.trim() === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

let polarClient: Polar | null = null;
let inbound: Inbound | null = null;

function getPolarClient() {
    if (!polarClient) {
        const accessToken = validateEnvVar("POLAR_ACCESS_TOKEN", process.env.POLAR_ACCESS_TOKEN);
        polarClient = new Polar({
            accessToken,
            server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
        });
    }
    return polarClient;
}

function getInbound() {
    if (!inbound) {
        const apiKey = validateEnvVar("INBOUND_API_KEY", process.env.INBOUND_API_KEY);
        inbound = new Inbound(apiKey);
    }
    return inbound;
}

// Instantiate ConvexHttpClient once
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

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

async function isDuplicateDelivery(key: string, eventType: string): Promise<boolean> {
    if (!key) return false;

    try {
        // Check if this event has already been processed (using Convex DB)
        const isDupe = await convex.query(api.webhookEvents.isDuplicate as any, {
            idempotencyKey: key,
        });

        if (isDupe) {
            return true;
        }

        // Record this event as processed
        await convex.mutation(api.webhookEvents.recordProcessedEvent as any, {
            idempotencyKey: key,
            provider: "polar",
            eventType,
        });

        return false;
    } catch (error) {
        console.error("Error checking webhook idempotency:", error);
        // On error, allow the webhook to process to avoid blocking
        return false;
    }
}

async function syncSubscriptionToConvex(subscription: any, resetUsage = false, eventType = "subscription.updated") {
    const payload = subscription ?? {};
    const { metadata, userId } = extractUserIdFromMetadata(payload.metadata);

    if (!userId) {
        const error = new Error(`Skipping Convex sync: missing or invalid userId in metadata. SubscriptionId: ${payload.id}`);
        // Sanitize metadata before logging (remove PII)
        const sanitizedMetadata = sanitizeSubscriptionMetadata(metadata);
        console.error(error.message, { sanitizedMetadata });
        await captureException(error, { sanitizedMetadata, subscriptionId: payload?.id });
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
            subscriptionId: payload.id,
        });
        return { success: false };
    }

    const idempotencyKey = buildSubscriptionIdempotencyKey(payload);
    if (await isDuplicateDelivery(idempotencyKey, eventType)) {
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
            customerId,
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
            subscriptionId,
            userId,
            productId,
            error: error instanceof Error ? error.message : String(error),
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
        // nextCookies() automatically enables CSRF protection
        // via sameSite: 'lax' cookies and CSRF token validation
        nextCookies(),
        // Password validation plugin for server-side password strength validation
        passwordValidationPlugin(),
        polar({
            client: getPolarClient(),
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
                    secret: validateEnvVar("POLAR_WEBHOOK_SECRET", process.env.POLAR_WEBHOOK_SECRET),
                    onSubscriptionCreated: async (event) => {
                        await syncSubscriptionToConvex(event.data, false, "subscription.created");
                    },
                    onSubscriptionUpdated: async (event) => {
                        await syncSubscriptionToConvex(event.data, false, "subscription.updated");
                    },
                    onSubscriptionActive: async (event) => {
                        await syncSubscriptionToConvex(event.data, true, "subscription.active");
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
            clientId: validateEnvVar("GITHUB_CLIENT_ID", process.env.GITHUB_CLIENT_ID),
            clientSecret: validateEnvVar("GITHUB_CLIENT_SECRET", process.env.GITHUB_CLIENT_SECRET),
        },
        google: {
            clientId: validateEnvVar("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID),
            clientSecret: validateEnvVar("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET),
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        async sendVerificationEmail({ user, url }: { user: { email: string }, url: string }) {
            const contextMessage = `sendEmailVerification(${user.email}, ${url})`;
            try {
                await getInbound().emails.send({
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
        async sendResetPasswordEmail({ user, url }: { user: { email: string }, url: string }) {
            const contextMessage = `sendResetPassword(${user.email}, ${url})`;
            try {
                await getInbound().emails.send({
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
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // Cache session for 5 minutes
        },
    },
    advanced: {
        cookiePrefix: "zapdev",
        // CSRF protection is enabled by default in Better Auth via:
        // 1. SameSite=Lax cookies (prevents CSRF attacks)
        // 2. CSRF token validation on state-changing operations
        // 3. Origin header validation
        generateId: false, // Use default ID generation
        crossSubDomainCookies: {
            enabled: false, // Disable for security unless needed
        },
    },
    // Security headers for cookies
    // Include both www and non-www versions to handle redirects
    trustedOrigins: process.env.NODE_ENV === "production"
        ? [
            getAppUrl(),
            "https://zapdev.link",
            "https://www.zapdev.link",
        ]
        : [getAppUrl(), "http://localhost:3000"],
});
