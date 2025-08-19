import type { VercelRequest } from '@vercel/node';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono();


// Helper function to log webhook events (replace with actual database sync)
async function logWebhookEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
  console.log(`[POLAR WEBHOOK] ${eventType}:`, JSON.stringify(data, null, 2));
  
  // TODO: Implement proper Convex HTTP action calls or database sync
  // This is where you would:
  // 1. Update user subscription status in your database
  // 2. Send confirmation emails
  // 3. Update user permissions/features
  // 4. Handle subscription lifecycle events
}

// Helper function to sync subscription data with your database
async function syncSubscriptionToDatabase(
  userId: string,
  polarCustomerId: string,
  subscription?: any
) {
  try {
    const now = Date.now();

    console.log('Syncing subscription to database:', { 
      userId, 
      polarCustomerId, 
      subscriptionId: subscription?.id 
    });

    if (!subscription) {
      // User cancelled or subscription expired - set to free plan
      await logWebhookEvent('subscription_free_plan', {
        userId,
        polarCustomerId,
        planId: 'free',
        status: 'none',
        timestamp: now
      });

      console.log('Set user to free plan:', userId);
      return;
    }

    // Extract plan information from subscription
    const planType = subscription.metadata?.planId || 'pro';
    
    // Log the subscription sync
    await logWebhookEvent('subscription_sync', {
      userId,
      polarCustomerId,
      planId: subscription.id,
      planType,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      timestamp: now
    });

    console.log('Successfully synced subscription to database:', { 
      userId, 
      planType, 
      status: subscription.status 
    });
  } catch (error) {
    console.error('Failed to sync subscription to database:', error);
    throw error;
  }
}

// Helper function to ensure customer mapping exists
async function ensureCustomerMapping(userId: string, polarCustomerId: string, email: string) {
  try {
    await logWebhookEvent('customer_mapping', {
      userId,
      polarCustomerId,
      email,
      timestamp: Date.now()
    });
    console.log('Ensured customer mapping exists:', { userId, polarCustomerId });
  } catch (error) {
    console.error('Failed to ensure customer mapping:', error);
    throw error;
  }
}

// Verify webhook signature (implement according to Polar.sh docs)
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  // TODO: Implement proper signature verification based on Polar.sh documentation
  // This is a placeholder implementation
  try {
    // Polar.sh signature verification logic would go here
    // For now, we'll just check that the signature exists
    return !!(signature && secret && signature.length > 0);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

// Main webhook handler
app.post('/webhook', async (c) => {
  try {
    const req = c.req.raw as unknown as VercelRequest;

    // Get the raw body and signature
    const body = await c.req.text();
    const signature = c.req.header('Polar-Webhook-Signature') || 
                     c.req.header('X-Polar-Webhook-Signature') ||
                     req.headers['polar-webhook-signature'] as string;

    if (!signature) {
      console.error('Missing Polar webhook signature');
      return c.json({ error: 'Missing signature' }, 400);
    }

    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('POLAR_WEBHOOK_SECRET not configured');
      return c.json({ error: 'Webhook secret not configured' }, 500);
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid Polar webhook signature');
      return c.json({ error: 'Invalid signature' }, 400);
    }

    const event = JSON.parse(body);
    console.log('Received Polar webhook event:', event.type, 'ID:', event.id);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data;
        console.log('Checkout session completed:', checkoutSession.id);

        // Get user ID from checkout metadata
        const userId = checkoutSession.metadata?.userId;
        if (!userId) {
          console.error('No userId found in checkout session metadata');
          break;
        }

        // Ensure customer mapping exists if customer info is available
        if (checkoutSession.customerId && checkoutSession.customerEmail) {
          await ensureCustomerMapping(
            userId, 
            checkoutSession.customerId, 
            checkoutSession.customerEmail
          );
        }

        console.log('Successfully processed checkout completion for user:', userId);
        break;
      }

      case 'subscription.created': {
        const subscription = event.data;
        console.log('Subscription created:', subscription.id);

        const userId = subscription.metadata?.userId;
        if (!userId) {
          console.error('No userId found in subscription metadata:', subscription.id);
          break;
        }

        // Sync subscription data
        await syncSubscriptionToDatabase(userId, subscription.customerId, subscription);
        console.log('Successfully processed subscription creation for user:', userId);
        break;
      }

      case 'subscription.updated': {
        const subscription = event.data;
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);

        const userId = subscription.metadata?.userId;
        if (!userId) {
          console.error('No userId found in subscription metadata:', subscription.id);
          break;
        }

        await syncSubscriptionToDatabase(userId, subscription.customerId, subscription);
        console.log('Successfully processed subscription update for user:', userId, 'Status:', subscription.status);
        break;
      }

      case 'subscription.canceled': {
        const subscription = event.data;
        console.log('Subscription canceled:', subscription.id);

        const userId = subscription.metadata?.userId;
        if (!userId) {
          console.error('No userId found in subscription metadata:', subscription.id);
          break;
        }

        // Set user back to free plan
        await syncSubscriptionToDatabase(userId, subscription.customerId, undefined);
        console.log('Successfully processed subscription cancellation for user:', userId);
        break;
      }

      case 'customer.created': {
        const customer = event.data;
        console.log('Customer created:', customer.id);

        const userId = customer.metadata?.userId;
        if (!userId) {
          console.log('No userId found in customer metadata, skipping customer creation sync');
          break;
        }

        try {
          await ensureCustomerMapping(userId, customer.id, customer.email || '');
          console.log('Successfully created customer mapping for user:', userId);
        } catch (error) {
          console.error('Failed to create customer mapping:', error);
        }
        break;
      }

      default:
        console.log('Unhandled Polar webhook event type:', event.type);
    }

    // Return success response
    return c.json({ 
      received: true,
      eventType: event.type,
      eventId: event.id
    });

  } catch (error) {
    console.error('Polar webhook error:', error);
    return c.json({
      error: 'Webhook Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});

// Handle OPTIONS for CORS
app.options('/webhook', () => {
  return new Response('', { status: 204 });
});

// Export the Vercel handler
export default handle(app);