import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex as convexPlugin } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { nextCookies } from "better-auth/next-js";
import { api } from "./_generated/api";
import { passwordValidationPlugin } from "../src/lib/password-validation-plugin";
import { ConvexHttpClient } from "convex/browser";

const siteUrl = process.env.SITE_URL!;

// Better Auth component client for Convex integration
export const authComponent = createClient<DataModel>(components.betterAuth);

// Helper functions for lazy initialization
function validateEnvVar(name: string, value: string | undefined): string {
    if (!value || value.trim() === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

let convexClient: ConvexHttpClient | null = null;

function getConvexClient() {
    if (!convexClient) {
        const url = validateEnvVar("NEXT_PUBLIC_CONVEX_URL", process.env.NEXT_PUBLIC_CONVEX_URL);
        convexClient = new ConvexHttpClient(url);
    }
    return convexClient;
}

let polarClient: Polar | null = null;

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

// Webhook helper functions
function extractUserIdFromMetadata(metadata: any): { metadata: any, userId: string | null } {
    const userId = metadata?.userId;
    return {
        metadata,
        userId: typeof userId === "string" && userId.trim() !== "" ? userId.trim() : null,
    };
}

function sanitizeSubscriptionMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== "object") return {};
    const { userId, ...rest } = metadata;
    return { userId: userId ? "***" : undefined, ...rest };
}

function toSafeTimestamp(value: any, fallback: number): number {
    if (typeof value === "number" && !isNaN(value) && value > 0) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        if (!isNaN(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return fallback;
}

function buildSubscriptionIdempotencyKey(subscription: any): string {
    const id = subscription?.id || "unknown";
    const status = subscription?.status || "unknown";
    const updatedAt = subscription?.modifiedAt || subscription?.updatedAt || Date.now();
    return `polar_subscription_${id}_${status}_${updatedAt}`;
}

/**
 * Create Better Auth instance with Convex adapter and Polar integration
 */
export const createAuth = (
    ctx: GenericCtx<DataModel>,
    { optionsOnly } = { optionsOnly: false },
) => {
    // Build plugins array conditionally based on available environment variables
    const plugins: any[] = [
        // Convex plugin MUST be first for proper integration
        convexPlugin(),
        // nextCookies() for CSRF protection
        nextCookies(),
        // Password validation plugin
        passwordValidationPlugin(),
    ];

    // Only add Polar plugin if credentials are available
    if (process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_WEBHOOK_SECRET) {
        plugins.push(
            polar({
                client: getPolarClient(),
                createCustomerOnSignUp: true,
                use: [
                    checkout({
                        authenticatedUsersOnly: true,
                        successUrl: `${getAppUrl()}/?subscription=success`,
                        returnUrl: `${getAppUrl()}/pricing?canceled=true`,
                    }),
                    portal(),
                    usage(),
                    webhooks({
                        secret: process.env.POLAR_WEBHOOK_SECRET,
                        onSubscriptionCreated: async (event) => {
                            await syncSubscriptionToConvex(ctx, event.data, false, "subscription.created");
                        },
                        onSubscriptionUpdated: async (event) => {
                            await syncSubscriptionToConvex(ctx, event.data, false, "subscription.updated");
                        },
                        onSubscriptionActive: async (event) => {
                            await syncSubscriptionToConvex(ctx, event.data, true, "subscription.active");
                        },
                        onSubscriptionCanceled: async (event) => {
                            const subscription = event.data;
                            await getConvexClient().mutation(api.subscriptions.markSubscriptionForCancellation, {
                                polarSubscriptionId: subscription.id,
                            });
                        },
                        onSubscriptionRevoked: async (event) => {
                            const subscription = event.data;
                            await getConvexClient().mutation(api.subscriptions.revokeSubscription, {
                                polarSubscriptionId: subscription.id,
                            });

                            const userId = subscription.metadata?.userId;
                            if (userId && typeof userId === "string" && userId.trim() !== "") {
                                await getConvexClient().mutation(api.usage.resetUsage, { userId });
                            }
                        },
                        onSubscriptionUncanceled: async (event) => {
                            const subscription = event.data;
                            await getConvexClient().mutation(api.subscriptions.reactivateSubscription, {
                                polarSubscriptionId: subscription.id,
                            });
                        },
                    }),
                ],
            })
        );
    }

    // Build social providers object conditionally
    const socialProviders: any = {};
    
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        socialProviders.github = {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        };
    }
    
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        socialProviders.google = {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        };
    }

    return betterAuth({
        // Disable logging when createAuth is called just to generate options
        logger: {
            disabled: optionsOnly,
        },
        baseURL: siteUrl,
        // Use Convex adapter for database operations
        database: authComponent.adapter(ctx),
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: true,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            async sendVerificationEmail({ user, url }: { user: { email: string }, url: string }) {
                // Note: Email sending will be handled by the client-side auth instance
                // This is here for type compatibility
                console.log(`Email verification for ${user.email}: ${url}`);
            },
            async sendResetPasswordEmail({ user, url }: { user: { email: string }, url: string }) {
                // Note: Email sending will be handled by the client-side auth instance
                // This is here for type compatibility
                console.log(`Password reset for ${user.email}: ${url}`);
            },
        },
        plugins,
        socialProviders,
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 60 * 5, // Cache session for 5 minutes
            },
        },
        advanced: {
            cookiePrefix: "zapdev",
            generateId: false,
            crossSubDomainCookies: {
                enabled: false,
            },
        },
        trustedOrigins: process.env.NODE_ENV === "production"
            ? [getAppUrl()]
            : [getAppUrl(), "http://localhost:3000"],
    });
};

// Subscription sync helper
async function syncSubscriptionToConvex(
    ctx: GenericCtx<DataModel>,
    subscription: any,
    resetUsage = false,
    eventType = "subscription.updated"
) {
    const payload = subscription ?? {};
    const { metadata, userId } = extractUserIdFromMetadata(payload.metadata);

    if (!userId) {
        const error = new Error(`Skipping Convex sync: missing or invalid userId in metadata. SubscriptionId: ${payload.id}`);
        console.error(error.message, { sanitizedMetadata: sanitizeSubscriptionMetadata(metadata) });
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

    // Check for duplicate delivery
    const isDupe = await getConvexClient().query(api.webhookEvents.isDuplicate, {
        idempotencyKey,
    });

    if (isDupe) {
        console.info("Skipping duplicate Polar webhook delivery", {
            userId,
            subscriptionId,
            idempotencyKey,
        });
        return { success: true, duplicate: true };
    }

    // Record this event as processed
    await getConvexClient().mutation(api.webhookEvents.recordProcessedEvent, {
        idempotencyKey,
        provider: "polar",
        eventType,
    });

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
        await getConvexClient().mutation(api.subscriptions.createOrUpdateSubscription, {
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
            await getConvexClient().mutation(api.usage.resetUsage, { userId });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to sync subscription to Convex", {
            subscriptionId,
            userId,
            productId,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}

/**
 * Example Convex query for getting the current authenticated user
 */
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return authComponent.getAuthUser(ctx);
    },
});
