import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG, STRIPE_WEBHOOK_EVENTS, syncStripeDataToCache } from './stripe';

/**
 * Verify and construct Stripe webhook event
 */
export const constructStripeEvent = (
  body: string,
  signature: string
): Stripe.Event => {
  if (!STRIPE_CONFIG.webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw new Error('Invalid webhook signature');
  }
};

/**
 * Process Stripe webhook event
 * Following the reference pattern of syncing data for relevant events
 */
export const processStripeWebhookEvent = async (event: Stripe.Event): Promise<void> => {
  try {
    // Skip processing if the event isn't one we're tracking
    if (!STRIPE_WEBHOOK_EVENTS.includes(event.type)) {
      console.log(`Skipping untracked event type: ${event.type}`);
      return;
    }

    console.log(`Processing Stripe webhook event: ${event.type}`);

    // Extract customer ID from the event
    const customerId = extractCustomerIdFromEvent(event);
    
    if (!customerId) {
      console.warn(`No customer ID found for event type: ${event.type}`);
      return;
    }

    // Sync the customer's subscription data
    await syncStripeDataToCache(customerId);
    
    // Handle specific event types if needed
    await handleSpecificEventType(event);

    console.log(`Successfully processed event ${event.type} for customer ${customerId}`);
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    throw error;
  }
};

/**
 * Extract customer ID from various Stripe event types
 */
const extractCustomerIdFromEvent = (event: Stripe.Event): string | null => {
  const eventData = event.data.object as { customer?: string | { id: string } } & Record<string, unknown>;

  // Direct customer field
  if (eventData.customer) {
    return typeof eventData.customer === 'string' 
      ? eventData.customer 
      : eventData.customer.id;
  }

  // For checkout sessions
  if (event.type === 'checkout.session.completed' && eventData.customer) {
    return eventData.customer;
  }

  // For subscription events
  if (eventData.object === 'subscription' && eventData.customer) {
    return eventData.customer;
  }

  // For invoice events
  if (eventData.object === 'invoice' && eventData.customer) {
    return eventData.customer;
  }

  // For payment intent events
  if (eventData.object === 'payment_intent' && eventData.customer) {
    return eventData.customer;
  }

  console.warn(`Could not extract customer ID from event type: ${event.type}`);
  return null;
};

/**
 * Handle specific event types that need special processing
 */
const handleSpecificEventType = async (event: Stripe.Event): Promise<void> => {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event);
      break;
    
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(event);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event);
      break;
    
    default:
      // For most events, just syncing the data is sufficient
      break;
  }
};

/**
 * Handle checkout session completed
 */
const handleCheckoutSessionCompleted = async (event: Stripe.Event): Promise<void> => {
  const session = event.data.object as Stripe.Checkout.Session;
  
  console.log(`Checkout session completed for customer: ${session.customer}`);
  
  // Additional logic for successful checkout
  // e.g., send welcome email, update user permissions, etc.
};

/**
 * Handle subscription created
 */
const handleSubscriptionCreated = async (event: Stripe.Event): Promise<void> => {
  const subscription = event.data.object as Stripe.Subscription;
  
  console.log(`New subscription created: ${subscription.id} for customer: ${subscription.customer}`);
  
  // Additional logic for new subscriptions
  // e.g., grant access to features, send confirmation email, etc.
};

/**
 * Handle subscription deleted/canceled
 */
const handleSubscriptionDeleted = async (event: Stripe.Event): Promise<void> => {
  const subscription = event.data.object as Stripe.Subscription;
  
  console.log(`Subscription canceled: ${subscription.id} for customer: ${subscription.customer}`);
  
  // Additional logic for canceled subscriptions
  // e.g., revoke access, send cancellation email, etc.
};

/**
 * Handle payment failed
 */
const handlePaymentFailed = async (event: Stripe.Event): Promise<void> => {
  const invoice = event.data.object as Stripe.Invoice;
  
  console.log(`Payment failed for invoice: ${invoice.id}, customer: ${invoice.customer}`);
  
  // Additional logic for failed payments
  // e.g., send dunning emails, update subscription status, etc.
};

/**
 * Handle payment succeeded
 */
const handlePaymentSucceeded = async (event: Stripe.Event): Promise<void> => {
  const invoice = event.data.object as Stripe.Invoice;
  
  console.log(`Payment succeeded for invoice: ${invoice.id}, customer: ${invoice.customer}`);
  
  // Additional logic for successful payments
  // e.g., send receipt, update usage limits, etc.
};

/**
 * Webhook handler for API routes
 * This is the main function to call from your webhook endpoint
 */
export const handleStripeWebhook = async (
  body: string,
  signature: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Construct and verify the event
    const event = constructStripeEvent(body, signature);
    
    // Process the event
    await processStripeWebhookEvent(event);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook handler error:', errorMessage);
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

/**
 * Utility function to safely handle webhook processing with error boundaries
 * Following the reference pattern of always returning success to Stripe
 */
export const safeWebhookHandler = async (
  body: string,
  signature: string
): Promise<Response> => {
  try {
    const result = await handleStripeWebhook(body, signature);
    
    if (!result.success) {
      // Log the error but still return 200 to Stripe to prevent retries
      console.error('Webhook processing failed:', result.error);
    }
    
    // Always return 200 to Stripe to acknowledge receipt
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Critical webhook handler error:', error);
    
    // Even on critical errors, return 200 to prevent Stripe retries
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
