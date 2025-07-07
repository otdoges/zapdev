'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { usePathname } from 'next/navigation'
import { errorLogger, ErrorCategory } from '@/lib/error-logger'

interface SentryProviderProps {
  children: React.ReactNode
}

export function SentryProvider({ children }: SentryProviderProps) {
  const pathname = usePathname()

  // Track page views
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${pathname}`,
      level: 'info',
      data: {
        pathname,
        timestamp: new Date().toISOString(),
      },
    })
  }, [pathname])

  // Integrate with our error logger
  useEffect(() => {
    // Override error logger to also send to Sentry
    const originalError = errorLogger.error
    const originalWarning = errorLogger.warning

    errorLogger.error = (category: ErrorCategory, message: string, ...args: any[]) => {
      // Call original logger
      originalError.call(errorLogger, category, message, ...args)

      // Send to Sentry with context
      Sentry.captureException(new Error(message), {
        tags: {
          category,
          component: 'error-logger',
        },
        extra: {
          args,
        },
      })
    }

    errorLogger.warning = (category: ErrorCategory, message: string, ...args: any[]) => {
      // Call original logger
      originalWarning.call(errorLogger, category, message, ...args)

      // Send to Sentry as breadcrumb
      Sentry.addBreadcrumb({
        category: 'warning',
        message,
        level: 'warning',
        data: {
          category,
          args,
        },
      })
    }

    // Cleanup on unmount
    return () => {
      errorLogger.error = originalError
      errorLogger.warning = originalWarning
    }
  }, [])

  // Set user context when available
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.name,
        })
      } catch (e) {
        // Ignore parse errors
      }
    } else {
      Sentry.setUser(null)
    }
  }, [])

  return <>{children}</>
}

// Custom hook for manual error capturing
export function useSentryError() {
  return {
    captureError: (error: Error, context?: Record<string, any>) => {
      Sentry.captureException(error, {
        extra: context,
      })
    },
    captureMessage: (message: string, level: Sentry.SeverityLevel = 'info') => {
      Sentry.captureMessage(message, level)
    },
    addBreadcrumb: (breadcrumb: {
      message: string
      category?: string
      level?: Sentry.SeverityLevel
      data?: Record<string, any>
    }) => {
      Sentry.addBreadcrumb(breadcrumb)
    },
    setContext: (key: string, context: Record<string, any>) => {
      Sentry.setContext(key, context)
    },
    setTag: (key: string, value: string | number | boolean) => {
      Sentry.setTag(key, value)
    },
  }
}