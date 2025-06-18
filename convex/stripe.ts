import { v } from "convex/values";
import { query, internalMutation, action, httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import Stripe from "stripe";

// Get the current user's own stripe customer id
export const getMyStripeCustomerId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();
    
    return user ? { hasCustomer: Boolean(user.stripeCustomerId) } : null;
  },
});

// INTERNAL: Set the stripe customer id for a user (only called by server-side code)
export const setStripeCustomerId = internalMutation({
  args: { email: v.string(), stripeCustomerId: v.string() },
  handler: async (ctx, { email, stripeCustomerId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { stripeCustomerId });
  },
});

// INTERNAL: Update user subscription details (only called by webhook handler)
export const updateUserSubscription = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripeSubscriptionStatus: v.string(),
    stripeCurrentPeriodEnd: v.number(),
    stripePriceId: v.string(),
  },
  handler: async (ctx, args) => {
    // Use index for better performance
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) => 
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .unique();

    if (!user) {
      console.warn(`User not found for stripe customer id: ${args.stripeCustomerId}`);
      return;
    }

    await ctx.db.patch(user._id, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeSubscriptionStatus: args.stripeSubscriptionStatus,
      stripeCurrentPeriodEnd: args.stripeCurrentPeriodEnd,
      stripePriceId: args.stripePriceId,
    });
  },
});

// Create a checkout session for the current user
export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string()
  },
  handler: async (ctx, { priceId, successUrl, cancelUrl }): Promise<{ url: string | null }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userEmail = identity.email!;
    
    // Get Stripe API key from environment
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    // Find or create user record
    const userRecord = await ctx.runQuery(api.users.getUserByEmail, { email: userEmail });
    
    let customerIdToUse = userRecord?.stripeCustomerId;
    
    // If no stripe customer exists, create one
    if (!customerIdToUse) {
      const customer = await stripe.customers.create({
        email: identity.email,
        name: identity.name,
        metadata: {
          userId: userRecord?._id || "unknown",
        },
      });
      
      customerIdToUse = customer.id;
      
      // Save the new customer ID
      await ctx.runMutation(internal.stripe.setStripeCustomerId, {
        email: userEmail,
        stripeCustomerId: customerIdToUse,
      });
    }
    
    // Create the checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerIdToUse,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    
    return { url: checkoutSession.url };
  },
});

// Handle Stripe webhooks
export const stripeWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return new Response("No signature provided", { status: 400 });
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`, { 
      status: 400 
    });
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (!session.customer || !session.subscription) {
        return new Response("No customer ID or subscription ID in session", { status: 400 });
      }
      
      const stripeCustomerId = typeof session.customer === 'string' 
        ? session.customer 
        : session.customer.id;
      
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      await ctx.runMutation(internal.stripe.updateUserSubscription, {
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd: (subscription as any).current_period_end,
        stripePriceId: subscription.items.data[0]?.price?.id,
      });
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;

      // The 'subscription' property is not always present on Invoice type, so we need to check for its existence using a type guard.
      const subscriptionId = (invoice as any).subscription;
      if (!invoice.customer || !subscriptionId) {
        // Not a subscription-related invoice, so we can ignore it.
        console.log("Skipping non-subscription invoice payment.");
        break;
      }
      
      const stripeCustomerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : (invoice.customer as Stripe.Customer).id;

      // The 'subscription' property is not always present on Invoice type, so we need to use the subscriptionId we extracted above.
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);

      await ctx.runMutation(internal.stripe.updateUserSubscription, {
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd: (subscription as any).current_period_end,
        stripePriceId: subscription.items.data[0]?.price?.id,
      });
      break;
    }
    
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      if (!subscription.customer) {
        return new Response("No customer in subscription", { status: 400 });
      }
      
      const stripeCustomerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;
      
      await ctx.runMutation(internal.stripe.updateUserSubscription, {
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd: (subscription as any).current_period_end,
        stripePriceId: subscription.items.data[0]?.price?.id,
      });
      break;
    }
  }
  
  return new Response(null, { status: 200 });
});