"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog if the API key is available
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        capture_pageview: false, // We capture pageviews manually
        capture_pageleave: true, // Enable pageleave capture
        capture_exceptions: true, // This enables capturing exceptions using Error Tracking
        debug: process.env.NODE_ENV === "development",
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            // Log when PostHog is loaded in development
            console.log('PostHog loaded');
          }
        },
        bootstrap: {
          distinctID: undefined,
          isIdentifiedID: false,
          featureFlags: {},
          featureFlagPayloads: {},
          sessionID: undefined
        }
      })
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('PostHog API key not found. Analytics tracking is disabled.');
    }
  }, [])

  // If PostHog key is missing, just render children without PostHog
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthogInstance = usePostHog()

  useEffect(() => {
    if (pathname && posthogInstance) {
      let url = window.origin + pathname
      const search = searchParams.toString()
      if (search) {
        url += "?" + search
      }
      posthogInstance.capture("$pageview", { "$current_url": url })
    }
  }, [pathname, searchParams, posthogInstance])

  return null
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}