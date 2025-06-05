import { PostHog } from "posthog-node"

/**
 * Returns a PostHog client initialized with your project key and host.
 * You can call this in server-side code to capture events.
 */
export default function PostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    // Adjust flush settings as needed
    flushAt: 1,
    flushInterval: 0,
  })

  return posthogClient
}
