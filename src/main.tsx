import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { PostHogProvider } from 'posthog-js/react'
import * as Sentry from '@sentry/react'
import { convex } from './lib/convex'
import { initializeApiKeySecurity } from './lib/api-key-validator'
import { shouldSendPII, shouldEnableScreenshots } from './lib/privacy-consent'
import App from './App.tsx'
import './index.css'

// PII scrubbing patterns
const PII_PATTERNS = [
  // Email addresses - simplified
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Phone numbers - US format only
  /\d{3}-\d{3}-\d{4}/g,
  // Social Security Numbers
  /\d{3}-\d{2}-\d{4}/g,
  // Credit card numbers - basic 16 digits
  /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
  // IP addresses - simple format
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g,
];

// Sensitive headers to remove
const SENSITIVE_HEADERS = [
  'authorization',
  'x-api-key',
  'x-auth-token',
  'cookie',
  'set-cookie',
  'x-forwarded-for',
  'x-real-ip',
  'x-user-email',
  'x-user-name',
];

/**
 * Scrub PII from text content
 */
function scrubPII(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  let scrubbed = text;
  
  // Replace PII patterns with redacted placeholders
  for (const pattern of PII_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, '[REDACTED]');
  }
  
  return scrubbed;
}

/**
 * Scrub sensitive headers from request data
 */
function scrubHeaders(headers: { [key: string]: string } | undefined): { [key: string]: string } | undefined {
  if (!headers || typeof headers !== 'object') return headers;
  
  const scrubbed = { ...headers };
  
  for (const header of SENSITIVE_HEADERS) {
    // Check both lowercase and original case
    if (Object.prototype.hasOwnProperty.call(scrubbed, header)) {
      Object.defineProperty(scrubbed, header, {
        value: '[REDACTED]',
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
    const lowerHeader = header.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(scrubbed, lowerHeader)) {
      Object.defineProperty(scrubbed, lowerHeader, {
        value: '[REDACTED]',
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
  }
  
  return scrubbed;
}
// Initialize Sentry with privacy-first configuration
if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_SENTRY_DSN !== 'put_sentry_shi') {
  try {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      enableLogs: true,
      // Privacy-first: Only send PII if both environment flag and user consent are true
      sendDefaultPii: shouldSendPII(),
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: !shouldSendPII(), // Mask text unless explicit consent
          blockAllMedia: true, // Always block media for privacy
        }),
        // Send console.log, console.error, and console.warn calls as logs to Sentry
        Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn'] }),
        // User Feedback integration with system color scheme
        Sentry.feedbackIntegration({
          colorScheme: "system",
          enableScreenshot: shouldEnableScreenshots(), // Only enable screenshots with explicit consent
          isNameRequired: false, // Don't require name for privacy
          isEmailRequired: false, // Don't require email for privacy
        }),
      ],
      tracesSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1,
      replaysSessionSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // PII scrubbing hook - runs before data is sent
      beforeSend(event) {
        try {
          // Don't send any data if user hasn't consented to error monitoring
          if (!shouldSendPII()) {
            // Scrub potential PII from error messages
            if (event.message) {
              event.message = scrubPII(event.message);
            }
            
            // Scrub exception messages
            if (event.exception?.values) {
              for (const exception of event.exception.values) {
                if (exception.value) {
                  exception.value = scrubPII(exception.value);
                }
                if (exception.stacktrace?.frames) {
                  for (const frame of exception.stacktrace.frames) {
                    if (frame.filename) {
                      // Only keep relative paths, remove absolute paths that might contain usernames
                      frame.filename = frame.filename.replace(/^.*[/\\]/, '');
                    }
                  }
                }
              }
            }
            
            // Remove request data that might contain PII
            if (event.request) {
              delete event.request.cookies;
              delete event.request.headers;
              delete event.request.env;
              if (event.request.url) {
                // Remove query parameters that might contain PII
                event.request.url = event.request.url.split('?')[0];
              }
            }
            
            // Remove user context
            delete event.user;
            
            // Remove tags that might contain PII
            if (event.tags) {
              delete event.tags.email;
              delete event.tags.username;
              delete event.tags.user_id;
            }
          } else {
            // Even with consent, scrub headers for security
            if (event.request?.headers) {
              event.request.headers = scrubHeaders(event.request.headers);
            }
          }
          
          return event;
        } catch (error) {
          console.warn('Error in Sentry beforeSend hook:', error);
          return event;
        }
      },
      
      // Breadcrumb scrubbing hook
      beforeBreadcrumb(breadcrumb) {
        try {
          // Always scrub sensitive data from breadcrumbs
          if (breadcrumb.message) {
            breadcrumb.message = scrubPII(breadcrumb.message);
          }
          
          // Remove sensitive breadcrumb data
          if (breadcrumb.data) {
            if (typeof breadcrumb.data === 'object' && breadcrumb.data !== null) {
              const data = breadcrumb.data as Record<string, unknown>;
              
              // Remove common PII fields
              delete data.email;
              delete data.username;
              delete data.password;
              delete data.token;
              delete data.authorization;
              delete data.cookie;
              
              // Scrub URL parameters
              if (data.url && typeof data.url === 'string') {
                data.url = data.url.split('?')[0];
              }
              
              // Scrub any string values for PII
              for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'string') {
                  Object.defineProperty(data, key, {
                    value: scrubPII(value),
                    writable: true,
                    enumerable: true,
                    configurable: true
                  });
                }
              }
            }
          }
          
          return breadcrumb;
        } catch (error) {
          console.warn('Error in Sentry beforeBreadcrumb hook:', error);
          return breadcrumb;
        }
      },
    });
    
    // Log privacy configuration for transparency
    if (import.meta.env.MODE === 'development') {
      console.log('🔒 Sentry initialized with privacy configuration:', {
        sendPII: shouldSendPII(),
        enableScreenshots: shouldEnableScreenshots(),
        environment: import.meta.env.MODE,
        piiFlag: import.meta.env.VITE_SENTRY_SEND_PII,
        screenshotFlag: import.meta.env.VITE_SENTRY_ENABLE_SCREENSHOTS,
      });
    }
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
          signInFallbackRedirectUrl="/chat"
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