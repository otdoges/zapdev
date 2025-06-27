import { Webhooks } from '@polar-sh/nextjs';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    errorLogger.info(ErrorCategory.API, 'Polar webhook received:', payload);

    // Handle different webhook events
    switch (payload.type) {
      case 'checkout.created':
        errorLogger.info(ErrorCategory.API, 'Checkout created:', payload.data);
        break;
      case 'checkout.updated':
        errorLogger.info(ErrorCategory.API, 'Checkout updated:', payload.data);
        break;
      case 'order.created':
        errorLogger.info(ErrorCategory.API, 'Order created:', payload.data);
        // Handle successful order - update user subscription status, etc.
        break;
      case 'subscription.created':
        errorLogger.info(ErrorCategory.API, 'Subscription created:', payload.data);
        break;
      case 'subscription.updated':
        errorLogger.info(ErrorCategory.API, 'Subscription updated:', payload.data);
        break;
      case 'subscription.canceled':
        errorLogger.info(ErrorCategory.API, 'Subscription canceled:', payload.data);
        break;
      default:
        errorLogger.info(ErrorCategory.API, 'Unhandled webhook event:', payload.type);
    }
  },
});
