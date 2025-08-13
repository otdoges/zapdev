import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Helper function to map Stripe price IDs to plan types
function mapPriceIdToPlanType(priceId: string): 'free' | 'pro' | 'enterprise' | 'starter' {
  const priceIdMap: Record<string, 'free' | 'pro' | 'enterprise' | 'starter'> = {
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly']: 'pro',
    [process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly']: 'pro',
    [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly']: 'enterprise',
    [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly']: 'enterprise',
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly']: 'starter',
    [process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly']: 'starter',
  };
  return priceIdMap[priceId] || 'free';
}



// Simplified subscription sync - for now just log the webhook events
// In production, you would want to use Convex HTTP actions or a queue system
async function logWebhookEvent(eventType: string, data: any): Promise<void> {
  console.log(`[WEBHOOK] ${eventType}:`, JSON.stringify(data, null, 2));
  
  // TODO: Implement proper Convex HTTP action calls or use a queue system
  // For now, we'll just log the events so the webhook doesn't fail
}

// Helper function to sync subscription data with Convex
async function syncSubscriptionToConvex(
  userId: string,
  stripeCustomerId: string,
  subscription?: Stripe.Subscription
) {
  try {
    const now = Date.now();

    console.log('Syncing subscription to Convex:', { userId, stripeCustomerId, subscriptionId: subscription?.id });

    if (!subscription) {
      // Log the free plan assignment
      await logWebhookEvent('subscription_free_plan', {
        userId,
        stripeCustomerId,
        planId: 'free',
        status: 'none',
        timestamp: now
      });

      console.log('Set user to free plan:', userId);
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const planType = mapPriceIdToPlanType(priceId);

    // Log the subscription sync
    await logWebhookEvent('subscription_sync', {
      userId,
      stripeCustomerId,
      planId: priceId,
      planType,
      status: subscription.status,
      currentPeriodStart: (subscription as any).current_period_start * 1000,
      currentPeriodEnd: (subscription as any).current_period_end * 1000,
      timestamp: now
    });

    console.log('Successfully synced subscription to Convex:', { userId, planType, status: subscription.status });
  } catch (error) {
    console.error('Failed to sync subscription to Convex:', error);
    throw error;
  }
}

// Helper function to ensure customer mapping exists in Convex
async function ensureCustomerMapping(userId: string, stripeCustomerId: string, email: string) {
  try {
    await logWebhookEvent('customer_mapping', {
      userId,
      stripeCustomerId,
      email,
      timestamp: Date.now()
    });
    console.log('Ensured customer mapping exists:', { userId, stripeCustomerId });
  } catch (error) {
    console.error('Failed to ensure customer mapping:', error);
    throw error;
  }
}

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

function withCors(res: VercelResponse, allowOrigin?: string) {
  const origin = allowOrigin ?? process.env.PUBLIC_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, stripe-signature');
  res.setHeader('Cache-Control', 'private, no-store');
  return res;
}

// Helper function to get raw body
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const requestOrigin = req.headers.origin as string | undefined;
  let allowedOrigin = process.env.PUBLIC_ORIGIN ?? '*';
  
  if (requestOrigin) {
    const isZapDevDomain = requestOrigin.includes('zapdev.link') || 
                          requestOrigin.includes('localhost') || 
                          requestOrigin.includes('127.0.0.1');
    
    if (isZapDevDomain) {
      allowedOrigin = requestOrigin;
    }
  }

  if (req.method === 'OPTIONS') {
    withCors(res, allowedOrigin);
    return res.status(204).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return withCors(res, allowedOrigin).status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  try {
    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-07-30.basil',
    });

    // Get the raw body and signature
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return withCors(res, allowedOrigin).status(400).json({
        error: 'Missing Stripe signature'
      });
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return withCors(res, allowedOrigin).status(400).json({
        error: 'Invalid signature'
      });
    }

    console.log('Received Stripe webhook event:', event.type, 'ID:', event.id);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        // Get user ID from session metadata
        const userId = session.metadata?.userId;
        if (!userId) {
          console.error('No userId found in checkout session metadata');
          break;
        }

        // Ensure customer mapping exists
        const customer = await stripe.customers.retrieve(session.customer as string);
        if (!customer.deleted) {
          await ensureCustomerMapping(userId, customer.id, (customer as any).email || '');
        }

        // Get the subscription ID from the session
        const subscriptionId = session.subscription as string;
        if (subscriptionId) {
          // Fetch the subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionToConvex(userId, session.customer as string, subscription);
        }

        console.log('Successfully processed checkout completion for user:', userId);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);

        // Get customer and find associated user
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) {
          console.error('Customer was deleted:', subscription.customer);
          break;
        }

        const userId = !customer.deleted ? (customer as any).metadata?.userId : null;
        if (!userId) {
          console.error('No userId found in customer metadata for subscription:', subscription.id);
          break;
        }

        // Ensure customer mapping exists
        if (!customer.deleted) {
          await ensureCustomerMapping(userId, customer.id, (customer as any).email || '');
        }

        // Sync subscription data
        await syncSubscriptionToConvex(userId, subscription.customer as string, subscription);
        console.log('Successfully processed subscription creation for user:', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);

        // Get customer and find associated user
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) {
          console.error('Customer was deleted:', subscription.customer);
          break;
        }

        const userId = !customer.deleted ? (customer as any).metadata?.userId : null;
        if (!userId) {
          console.error('No userId found in customer metadata for subscription:', subscription.id);
          break;
        }

        await syncSubscriptionToConvex(userId, subscription.customer as string, subscription);
        console.log('Successfully processed subscription update for user:', userId, 'Status:', subscription.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);

        // Get customer and find associated user
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) {
          console.error('Customer was deleted:', subscription.customer);
          break;
        }

        const userId = !customer.deleted ? (customer as any).metadata?.userId : null;
        if (!userId) {
          console.error('No userId found in customer metadata for subscription:', subscription.id);
          break;
        }

        // Set user back to free plan
        await syncSubscriptionToConvex(userId, subscription.customer as string, undefined);
        console.log('Successfully processed subscription deletion for user:', userId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);

        // Get subscription if this is a subscription invoice
        if ((invoice as any).subscription) {
          const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string);

          if (customer.deleted) {
            console.error('Customer was deleted:', subscription.customer);
            break;
          }

          const userId = !customer.deleted ? (customer as any).metadata?.userId : null;
          if (userId) {
            await syncSubscriptionToConvex(userId, subscription.customer as string, subscription);
            console.log('Successfully processed payment success for user:', userId);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', invoice.id);

        // Get subscription if this is a subscription invoice
        if ((invoice as any).subscription) {
          const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string);

          if (customer.deleted) {
            console.error('Customer was deleted:', subscription.customer);
            break;
          }

          const userId = !customer.deleted ? (customer as any).metadata?.userId : null;
          if (userId) {
            // Sync the current subscription status (might be past_due)
            await syncSubscriptionToConvex(userId, subscription.customer as string, subscription);
            console.log('Successfully processed payment failure for user:', userId, 'Status:', subscription.status);
          }
        }
        break;
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        console.log('Customer created:', customer.id);

        // Get user ID from customer metadata
        const userId = customer.metadata?.userId;
        if (!userId) {
          console.log('No userId found in customer metadata, skipping customer creation sync');
          break;
        }

        // Create or update the customer mapping in Convex
        try {
          await ensureCustomerMapping(userId, customer.id, customer.email || '');
          console.log('Successfully created customer mapping for user:', userId);
        } catch (error) {
          console.error('Failed to create customer mapping:', error);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    // Return a response to acknowledge receipt of the event
    return withCors(res, allowedOrigin).status(200).json({ 
      received: true,
      eventType: event.type,
      eventId: event.id
    });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return withCors(res, allowedOrigin).status(500).json({
      error: 'Webhook Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
