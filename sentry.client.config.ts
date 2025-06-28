import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || ''

// Only initialize Sentry if we have a DSN
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.2',
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      Sentry.browserTracingIntegration(),
    ],
    
    // Configure error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException
        
        // Ignore specific errors
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = (error as Error).message
          
          // Ignore chunk loading errors (common in SPAs)
          if (errorMessage?.includes('Loading chunk')) {
            return null
          }
          
          // Ignore network errors that are expected
          if (errorMessage?.includes('NetworkError') || 
              errorMessage?.includes('Failed to fetch')) {
            console.log('Network error captured but not sent to Sentry:', error)
            return null
          }
          
          // Ignore ResizeObserver errors (benign browser quirk)
          if (errorMessage?.includes('ResizeObserver loop limit exceeded')) {
            return null
          }
        }
      }
      
      // Add user context if available
      const user = typeof window !== 'undefined' ? 
        window.localStorage.getItem('user') : null
      if (user) {
        try {
          const userData = JSON.parse(user)
          event.user = {
            id: userData.id,
            email: userData.email,
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      return event
    },
    
    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null
      }
      
      // Add custom breadcrumbs for our app
      if (breadcrumb.category === 'navigation') {
        breadcrumb.data = {
          ...breadcrumb.data,
          appSection: window.location.pathname.split('/')[1] || 'home'
        }
      }
      
      return breadcrumb
    },
  })
}