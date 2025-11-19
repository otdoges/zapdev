import { betterAuth } from "better-auth";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { nextCookies } from "better-auth/next-js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
});

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
                    secret: process.env.POLAR_WEBHOOK_SECRET!,
                    onSubscriptionCreated: async (event) => {
                        const subscription = event.data;
                        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
                        const userId = subscription.metadata?.userId as string;

                        if (userId) {
                            await convex.mutation(api.subscriptions.createOrUpdateSubscription, {
                                userId,
                                polarCustomerId: subscription.customerId,
                                polarSubscriptionId: subscription.id,
                                productId: subscription.productId,
                                productName: subscription.product?.name || "Pro",
                                status: subscription.status as any,
                                currentPeriodStart: subscription.currentPeriodStart
                                    ? new Date(subscription.currentPeriodStart).getTime()
                                    : Date.now(),
                                currentPeriodEnd: subscription.currentPeriodEnd
                                    ? new Date(subscription.currentPeriodEnd).getTime()
                                    : Date.now() + 30 * 24 * 60 * 60 * 1000,
                                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
                                metadata: subscription.metadata,
                            });
                        }
                    },
                    onSubscriptionUpdated: async (event) => {
                        const subscription = event.data;
                        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
                        const userId = subscription.metadata?.userId as string;

                        if (userId) {
                            await convex.mutation(api.subscriptions.createOrUpdateSubscription, {
                                userId,
                                polarCustomerId: subscription.customerId,
                                polarSubscriptionId: subscription.id,
                                productId: subscription.productId,
                                productName: subscription.product?.name || "Pro",
                                status: subscription.status as any,
                                currentPeriodStart: subscription.currentPeriodStart
                                    ? new Date(subscription.currentPeriodStart).getTime()
                                    : Date.now(),
                                currentPeriodEnd: subscription.currentPeriodEnd
                                    ? new Date(subscription.currentPeriodEnd).getTime()
                                    : Date.now() + 30 * 24 * 60 * 60 * 1000,
                                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
                                metadata: subscription.metadata,
                            });
                        }
                    },
                    onSubscriptionActive: async (event) => {
                        const subscription = event.data;
                        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
                        const userId = subscription.metadata?.userId as string;

                        if (userId) {
                            await convex.mutation(api.subscriptions.createOrUpdateSubscription, {
                                userId,
                                polarCustomerId: subscription.customerId,
                                polarSubscriptionId: subscription.id,
                                productId: subscription.productId,
                                productName: subscription.product?.name || "Pro",
                                status: subscription.status as any,
                                currentPeriodStart: subscription.currentPeriodStart
                                    ? new Date(subscription.currentPeriodStart).getTime()
                                    : Date.now(),
                                currentPeriodEnd: subscription.currentPeriodEnd
                                    ? new Date(subscription.currentPeriodEnd).getTime()
                                    : Date.now() + 30 * 24 * 60 * 60 * 1000,
                                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
                                metadata: subscription.metadata,
                            });

                            // Grant Pro credits
                            await convex.mutation(api.usage.resetUsage, { userId });
                        }
                    },
                    onSubscriptionCanceled: async (event) => {
                        const subscription = event.data;
                        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
                        await convex.mutation(api.subscriptions.markSubscriptionForCancellation, {
                            polarSubscriptionId: subscription.id,
                        });
                    },
                    onSubscriptionRevoked: async (event) => {
                        const subscription = event.data;
                        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
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
                        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
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
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    emailAndPassword: {
        enabled: true,
    }
});
