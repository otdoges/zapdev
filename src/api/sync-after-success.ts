import { syncStripeDataToConvex, getStripeCustomerId } from '@/lib/convex-stripe';
import { SubscriptionData } from '@/lib/stripe';
import { authenticateWithClerk, AuthenticatedUser } from '@/lib/clerk-auth';

export async function syncAfterSuccess(
  headers: Record<string, string | undefined>
): Promise<SubscriptionData> {
  try {
    // Authenticate the user with Clerk
    const user = await authenticateWithClerk(headers);
    
    // Get the Stripe customer ID for this Clerk user from Convex
    const stripeCustomerId = await getStripeCustomerId(user.id);
    
    if (!stripeCustomerId) {
      throw new Error(`No Stripe customer found for Clerk user: ${user.id}`);
    }

    // Sync the latest subscription data from Stripe to Convex
    const subscriptionData = await syncStripeDataToConvex(stripeCustomerId);
    
    console.log(`Synced subscription data for Clerk user ${user.id} (${user.email})`);
    
    return subscriptionData;
    
  } catch (error) {
    console.error('Error syncing after success:', error);
    throw new Error(`Failed to sync subscription data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 