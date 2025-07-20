import { stripe, allowedEvents, extractCustomerIdFromEvent } from '@/lib/stripe';
import { syncStripeDataToConvex } from '@/lib/convex-stripe';

export async function handleStripeWebhook(
  rawBody: string,
  signature: string
): Promise<{ received: boolean; error?: string }> {
  try {
    // Verify the webhook signature
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Received Stripe webhook: ${event.type}`);

    // Check if this is an event type we care about
    if (!allowedEvents.includes(event.type)) {
      console.log(`Ignoring webhook event type: ${event.type}`);
      return { received: true };
    }

    // Extract customer ID from the event
    const customerId = extractCustomerIdFromEvent(event);
    
    if (!customerId) {
      console.warn(`Could not extract customer ID from event type: ${event.type}`);
      return { received: true };
    }

    // Sync the subscription data to Convex database
    await syncStripeDataToConvex(customerId);
    
    console.log(`Successfully synced data to Convex for customer: ${customerId}`);
    
    return { received: true };
    
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return { 
      received: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 