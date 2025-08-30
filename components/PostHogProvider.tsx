'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { initPostHog, identifyUser } from '@/lib/posthog'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    // Initialize PostHog
    initPostHog()
  }, [])

  useEffect(() => {
    // Identify user when loaded
    if (isLoaded && user) {
      identifyUser(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName,
        subscription_type: user.publicMetadata?.subscriptionType || 'free',
        created_at: user.createdAt,
      })
    }
  }, [isLoaded, user])

  return <>{children}</>
}
