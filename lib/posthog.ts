import { PostHog } from 'posthog-node';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

/**
 * Returns a PostHog client initialized with your project key and host.
 * You can call this in server-side code to capture events.
 */
export default function PostHogClient() {
  // Return null if required environment variables are missing
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    if (process.env.NODE_ENV === 'development') {
      errorLogger.warning(
        ErrorCategory.GENERAL,
        'PostHog API key not found. Server-side analytics tracking is disabled.'
      );
    }
    return null;
  }

  // Default host if not provided
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host,
    // Adjust flush settings as needed
    flushAt: 1,
    flushInterval: 0,
  });

  return posthogClient;
}
