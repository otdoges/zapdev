import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { PostHogProvider } from 'posthog-js/react'
import * as Sentry from '@sentry/react'
import type { PostHog } from 'posthog-js';
import { convex } from './lib/convex'
import { initializeApiKeySecurity } from './lib/api-key-validator'
import App from './App.tsx'
import './index.css'

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_SENTRY_DSN !== 'put_sentry_shi') {
  try {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      enableLogs: true,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
        // Send console.log, console.error, and console.warn calls as logs to Sentry
        Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn'] }),
      ],
      tracesSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1,
      replaysSessionSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error);
  }
} else if (import.meta.env.MODE === 'development') {
  console.log('Sentry not initialized - DSN not configured');
}

// Initialize API key security monitoring (production only)
if (import.meta.env.PROD) {
  try {
    initializeApiKeySecurity();
  } catch (error) {
    console.error('Failed to initialize API key security:', error);
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key - Check your environment configuration");
}

// Security validation for production - temporarily disabled for development
// if (import.meta.env.PROD && PUBLISHABLE_KEY.startsWith('pk_test_')) {
//   console.error('⚠️  SECURITY WARNING: Using test keys in production environment!');
//   throw new Error('Production deployment requires live Clerk keys (pk_live_*)');
// }

const root = createRoot(document.getElementById('root')!);

// Initialize PostHog with proper error handling
const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  capture_pageview: false, // Disable automatic pageview capture for better control
  disable_session_recording: import.meta.env.MODE === 'development',
  loaded: (posthog: PostHog) => {
    if (import.meta.env.MODE === 'development') console.log('PostHog loaded');
  },
  on_xhr_error: (failedRequest: unknown) => {
    // Gracefully handle blocked requests (ad blockers, etc.)
    console.warn('PostHog request blocked (likely by ad blocker)', failedRequest);
  }
};

root.render(
  <StrictMode>
    <PostHogProvider 
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={posthogOptions}
    >
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        afterSignOutUrl="/"
        fallbackRedirectUrl="/chat"
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90',
            card: 'bg-card border border-border',
          },
        }}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </PostHogProvider>
  </StrictMode>
);