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
  console.warn("⚠️  Missing Clerk Publishable Key - Authentication will be disabled");
  console.log("💡 To enable authentication:");
  console.log("   1. Get a Clerk key from: https://dashboard.clerk.com");
  console.log("   2. Add VITE_CLERK_PUBLISHABLE_KEY=pk_test_... to .env.local");
  console.log("   3. Restart the development server");
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

// Fallback component when authentication is not configured
const UnauthenticatedApp = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
    <div className="max-w-md w-full space-y-6 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">ZapDev AI Platform</h1>
        <p className="text-slate-300 text-lg">Authentication Setup Required</p>
      </div>
      
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 space-y-4 text-left">
        <h2 className="text-xl font-semibold text-white">Quick Setup:</h2>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <p className="text-white font-medium">Get Clerk API Key</p>
              <p>Visit <code className="bg-slate-700 px-1 rounded">dashboard.clerk.com</code></p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <p className="text-white font-medium">Get Convex URL</p>
              <p>Visit <code className="bg-slate-700 px-1 rounded">dashboard.convex.dev</code></p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <p className="text-white font-medium">Update .env.local</p>
              <code className="block bg-slate-700 p-2 rounded mt-1 text-xs">
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...<br/>
VITE_CONVEX_URL=https://your-app.convex.cloud
              </code>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => window.location.reload()} 
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Refresh After Setup
      </button>
    </div>
  </div>
);

root.render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
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
    ) : (
      <UnauthenticatedApp />
    )}
  </StrictMode>
);