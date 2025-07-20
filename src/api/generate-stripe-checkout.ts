import { stripe } from '@/lib/stripe';
import { getOrCreateStripeCustomer } from '@/lib/convex-stripe';
import { authenticateWithClerk, AuthenticatedUser } from '@/lib/clerk-auth';

export async function generateStripeCheckout(
  headers: Record<string, string | undefined>,
  priceId: string
): Promise<{ url: string | null }> {
  try {
    // Authenticate the user with Clerk
    const user = await authenticateWithClerk(headers);
    
    if (!priceId) {
      throw new Error('Price ID is required');
    }

    // Get or create Stripe customer using Clerk user data and Convex storage
    const stripeCustomerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined
    );

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5173'}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        userId: user.id,
        clerkUserId: user.id, // Store Clerk user ID explicitly
        userEmail: user.email,
      },
    });

    // Return the session URL
    return { url: session.url };
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 