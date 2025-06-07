import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

let stripe: Stripe;

export const getStripeClient = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

export async function syncStripeDataToConvex(customerId: string) {
  const stripeClient = getStripeClient();
  const subscriptions = await stripeClient.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: "all",
  });

  if (subscriptions.data.length === 0) {
    return;
  }

  const subscription = subscriptions.data[0];

  await convex.mutation(api.stripe.updateUserSubscription, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionStatus: subscription.status,
    stripeCurrentPeriodEnd: (subscription as any).current_period_end * 1000,
    stripePriceId: subscription.items.data[0].price.id,
  });
}

export const allowedEvents: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.pending_update_applied",
  "customer.subscription.pending_update_expired",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "invoice.upcoming",
  "invoice.marked_uncollectible",
  "invoice.payment_succeeded",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
]; 