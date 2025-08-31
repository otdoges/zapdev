import posthog from 'posthog-js'

export const initPostHog = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    try {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug()
        },
        capture_pageview: true,
        capture_pageleave: true,
        // Disable autocapture to prevent network errors on domains without proper proxy
        autocapture: false,
        disable_session_recording: true,
        // Ensure requests go to correct endpoint
        cross_subdomain_cookie: false,
        secure_cookie: true,
        persistence: 'localStorage',
        // Add timeout to prevent hanging requests
        xhr_timeout: 10000,
      })
    } catch (error) {
      console.warn('PostHog initialization failed:', error)
    }
  }
}

export const trackEvent = (event: string, properties?: any) => {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties)
  }
}

export const identifyUser = (userId: string, traits?: any) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, traits)
  }
}

export const trackSubscriptionEvent = (userId: string, subscriptionType: 'free' | 'pro' | 'enterprise', action: 'upgrade' | 'downgrade' | 'cancel' | 'renew') => {
  trackEvent('subscription_event', {
    user_id: userId,
    subscription_type: subscriptionType,
    action,
    timestamp: new Date().toISOString()
  })
}

export const trackFeatureUsage = (userId: string, feature: string, isProFeature: boolean = false, metadata?: any) => {
  trackEvent('feature_usage', {
    user_id: userId,
    feature,
    is_pro_feature: isProFeature,
    ...metadata,
    timestamp: new Date().toISOString()
  })
}

export const trackAIAgentUsage = (userId: string, agentType: string, action: string, backgroundMode: boolean = false) => {
  trackEvent('ai_agent_usage', {
    user_id: userId,
    agent_type: agentType,
    action,
    background_mode: backgroundMode,
    timestamp: new Date().toISOString()
  })
}

export default posthog
