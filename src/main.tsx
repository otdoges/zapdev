import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { PostHogProvider } from 'posthog-js/react'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import * as Sentry from '@sentry/react'
import { convex } from './lib/convex'
import { initializeApiKeySecurity } from './lib/api-key-validator'
import App from './App.tsx'
import './index.css'

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
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
root.render(
  <StrictMode>
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
{import.meta.env.VITE_PUBLIC_POSTHOG_KEY ? (
          <PostHogProvider
            apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
            options={{
              api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
              capture_exceptions: true,
              debug: import.meta.env.MODE === 'development',
            }}
          >
            <App />
          </PostHogProvider>
        ) : (
          <App />
        )}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>
);