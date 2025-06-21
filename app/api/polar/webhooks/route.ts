import { Webhooks } from '@polar-sh/nextjs';

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    console.log('Polar webhook received:', payload);
    
    // Handle different webhook events
    switch (payload.type) {
      case 'checkout.created':
        console.log('Checkout created:', payload.data);
        break;
      case 'checkout.updated':
        console.log('Checkout updated:', payload.data);
        break;
      case 'order.created':
        console.log('Order created:', payload.data);
        // Handle successful order - update user subscription status, etc.
        break;
      case 'subscription.created':
        console.log('Subscription created:', payload.data);
        break;
      case 'subscription.updated':
        console.log('Subscription updated:', payload.data);
        break;
      case 'subscription.canceled':
        console.log('Subscription canceled:', payload.data);
        break;
      default:
        console.log('Unhandled webhook event:', payload.type);
    }
  },
}); 