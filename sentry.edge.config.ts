import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || ''

// Only initialize Sentry if we have a DSN
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.2',
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    
    // Configure error filtering for edge runtime
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException
        
        // Ignore specific edge runtime errors
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = (error as Error).message
          
          // Ignore edge function timeout warnings (handled by platform)
          if (errorMessage?.includes('edge function timeout') ||
              errorMessage?.includes('execution deadline')) {
            return null
          }
        }
      }
      
      // Add edge runtime context
      event.contexts = {
        ...event.contexts,
        runtime: {
          name: 'edge',
          version: process.env.NEXT_RUNTIME || 'unknown',
        },
      }
      
      return event
    },
  })
}