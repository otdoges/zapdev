import posthog from "posthog-js"
import * as Sentry from "@sentry/nextjs"

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    person_profiles: 'identified_only',
    capture_pageview: false, // Disable automatic pageview capture
    autocapture: false, // Disable autocapture to prevent network errors
    disable_session_recording: true,
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    // Add timeout to prevent hanging requests
    xhr_timeout: 10000,
    // Handle errors gracefully
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        console.log("PostHog loaded successfully");
      }
    },
    on_xhr_error: (failedRequest) => {
      console.warn("PostHog request failed:", failedRequest);
    }
  });
}

// Add the required Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;