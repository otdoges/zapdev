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
    
    // Configure error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException
        
        // Ignore specific database errors that are handled
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = (error as Error).message
          
          // Ignore "no rows found" errors (expected behavior)
          if (errorMessage?.includes('PGRST116') || 
              errorMessage?.includes('no rows found')) {
            return null
          }
          
          // Ignore rate limit errors (handled by middleware)
          if (errorMessage?.includes('rate limit') ||
              errorMessage?.includes('too many requests')) {
            return null
          }
        }
      }
      
      // Enhance error context
      if (event.request) {
        // Add custom context
        event.extra = {
          ...event.extra,
          nodeVersion: process.version,
          serverRegion: process.env.VERCEL_REGION || 'unknown',
        }
      }
      
      return event
    },
    
    // Integrations
    integrations: [
      // Database query tracking
      Sentry.extraErrorDataIntegration({
        depth: 5,
      }),
    ],
    
    // Profiling (only in production)
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  })
}