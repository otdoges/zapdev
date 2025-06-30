'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog if the API key is available
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        capture_pageview: false, // We capture pageviews manually
        capture_pageleave: true, // Enable pageleave capture
        capture_exceptions: true, // This enables capturing exceptions using Error Tracking
        debug: process.env.NODE_ENV === 'development',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            // Log when PostHog is loaded in development
            errorLogger.info(ErrorCategory.GENERAL, 'PostHog loaded successfully');
          }
          
          // Set up performance monitoring
          posthog.startSessionRecording();
          
          // Identify user properties if available
          const userAgent = navigator.userAgent;
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const language = navigator.language;
          
          posthog.register({
            $user_agent: userAgent,
            $timezone: timezone,
            $language: language,
            $current_url: window.location.href,
          });
        },
        bootstrap: {
          distinctID: undefined,
          isIdentifiedID: false,
          featureFlags: {},
          featureFlagPayloads: {},
          sessionID: undefined,
        },
        // Enhanced error tracking - sanitize data before sending
        before_send: (event) => {
          if (event && event.properties && typeof event.properties === 'object') {
            const sanitized = { ...event.properties } as Record<string, unknown>;
            // Remove potential sensitive fields
            delete sanitized.password;
            delete sanitized.token;
            delete sanitized.apiKey;
            delete sanitized.authorization;
            event.properties = sanitized;
          }
          return event;
        },
      });
      
      // Set up global error handler for PostHog
      window.addEventListener('error', (event) => {
        posthog.capture('javascript_error', {
          error_message: event.message,
          error_filename: event.filename,
          error_lineno: event.lineno,
          error_colno: event.colno,
          error_stack: event.error?.stack,
        });
      });
      
      // Set up unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        posthog.capture('unhandled_promise_rejection', {
          reason: event.reason?.toString(),
          stack: event.reason?.stack,
        });
      });
    } else if (process.env.NODE_ENV === 'development') {
      errorLogger.warning(
        ErrorCategory.GENERAL,
        'PostHog API key not found. Analytics tracking is disabled.'
      );
    }
  }, []);

  // If PostHog key is missing, just render children without PostHog
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogInstance = usePostHog();

  useEffect(() => {
    if (pathname && posthogInstance) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) {
        url += '?' + search;
      }
      posthogInstance.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams, posthogInstance]);

  return null;
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}
