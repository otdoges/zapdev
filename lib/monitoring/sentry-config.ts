import * as Sentry from '@sentry/nextjs';
import { User } from '@clerk/nextjs/server';

interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  enableTracing?: boolean;
  enableProfiler?: boolean;
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
  beforeSendTransaction?: (transaction: Sentry.Transaction) => Sentry.Transaction | null;
}

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: Date;
  extra?: Record<string, any>;
  tags?: Record<string, string>;
  level?: Sentry.SeverityLevel;
}

export class SentryManager {
  private initialized = false;
  private config: SentryConfig;

  constructor(config: SentryConfig) {
    this.config = {
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      enableTracing: true,
      enableProfiler: process.env.NODE_ENV === 'production',
      environment: process.env.NODE_ENV || 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
      ...config,
    };
  }

  initialize(): void {
    if (this.initialized) return;

    if (!this.config.dsn) {
      console.warn('Sentry DSN not provided, error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Performance monitoring
        enableTracing: this.config.enableTracing,
        profilesSampleRate: this.config.enableProfiler ? 0.1 : 0,

        // Integrations
        integrations: [
          new Sentry.BrowserTracing({
            tracingOrigins: [
              'localhost',
              /^\//,
              /^https:\/\/[^/]*\.zapdev\.com/,
              /^https:\/\/[^/]*\.vercel\.app/,
            ],
          }),
        ],

        // Filtering and preprocessing
        beforeSend: (event, hint) => {
          // Custom filtering logic
          if (this.config.beforeSend) {
            return this.config.beforeSend(event);
          }

          // Filter out common noise
          if (this.isNoiseError(event, hint)) {
            return null;
          }

          // Enhance error with additional context
          this.enhanceErrorEvent(event);

          return event;
        },

        beforeSendTransaction: (transaction) => {
          // Filter out unimportant transactions
          if (this.config.beforeSendTransaction) {
            return this.config.beforeSendTransaction(transaction);
          }

          // Skip health check transactions
          if (transaction.name?.includes('/api/health')) {
            return null;
          }

          return transaction;
        },

        // Additional options
        attachStacktrace: true,
        sendDefaultPii: false, // Don't send personal information
        maxBreadcrumbs: 100,
        debug: process.env.NODE_ENV === 'development',
      });

      this.initialized = true;
      console.log('✅ Sentry initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  private isNoiseError(event: Sentry.Event, hint?: Sentry.EventHint): boolean {
    const error = hint?.originalException;
    
    // Filter out network errors that we can't control
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const noisePatterns = [
        'network error',
        'fetch error',
        'loading css chunk',
        'loading chunk',
        'non-error promise rejection',
        'script error',
        'network request failed',
        'failed to fetch',
      ];
      
      if (noisePatterns.some(pattern => message.includes(pattern))) {
        return true;
      }
    }

    // Filter out specific error types
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        if (exception.type === 'ChunkLoadError') return true;
        if (exception.type === 'NavigationDuplicated') return true;
        if (exception.type === 'AbortError') return true;
      }
    }

    return false;
  }

  private enhanceErrorEvent(event: Sentry.Event): void {
    // Add deployment info
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      event.tags = {
        ...event.tags,
        commit: process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7),
      };
    }

    if (process.env.VERCEL_URL) {
      event.tags = {
        ...event.tags,
        deployment: process.env.VERCEL_URL,
      };
    }

    // Add performance context
    if (typeof window !== 'undefined') {
      const navigation = window.performance?.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        event.contexts = {
          ...event.contexts,
          performance: {
            dns_time: navigation.domainLookupEnd - navigation.domainLookupStart,
            connect_time: navigation.connectEnd - navigation.connectStart,
            response_time: navigation.responseEnd - navigation.responseStart,
            dom_interactive: navigation.domInteractive - navigation.navigationStart,
            dom_complete: navigation.domComplete - navigation.navigationStart,
          },
        };
      }
    }
  }

  captureException(error: Error, context?: ErrorContext): string {
    if (!this.initialized) {
      console.error('Sentry not initialized, logging error locally:', error);
      return '';
    }

    return Sentry.captureException(error, {
      contexts: {
        ...(context?.extra && { extra: context.extra }),
      },
      tags: context?.tags,
      level: context?.level || 'error',
      user: context?.userId ? { id: context.userId } : undefined,
      extra: {
        sessionId: context?.sessionId,
        userAgent: context?.userAgent,
        url: context?.url,
        timestamp: context?.timestamp || new Date(),
      },
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: ErrorContext): string {
    if (!this.initialized) {
      console.log(`Sentry not initialized, logging message locally [${level}]:`, message);
      return '';
    }

    return Sentry.captureMessage(message, {
      level,
      contexts: {
        ...(context?.extra && { extra: context.extra }),
      },
      tags: context?.tags,
      user: context?.userId ? { id: context.userId } : undefined,
      extra: {
        sessionId: context?.sessionId,
        userAgent: context?.userAgent,
        url: context?.url,
        timestamp: context?.timestamp || new Date(),
      },
    });
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  setContext(key: string, context: any): void {
    if (!this.initialized) return;
    Sentry.setContext(key, context);
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.initialized) return;
    Sentry.addBreadcrumb(breadcrumb);
  }

  withScope(callback: (scope: Sentry.Scope) => void): void {
    if (!this.initialized) return;
    Sentry.withScope(callback);
  }

  startTransaction(context: Sentry.TransactionContext): Sentry.Transaction | undefined {
    if (!this.initialized) return undefined;
    return Sentry.startTransaction(context);
  }

  getCurrentHub(): Sentry.Hub {
    return Sentry.getCurrentHub();
  }

  // Performance monitoring helpers
  measurePerformance<T>(name: string, operation: () => T | Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const transaction = this.startTransaction({ name, op: 'function' });
      
      try {
        const result = await operation();
        transaction?.setStatus('ok');
        resolve(result);
      } catch (error) {
        transaction?.setStatus('internal_error');
        this.captureException(error as Error, {
          tags: { operation: name },
          level: 'error',
        });
        reject(error);
      } finally {
        transaction?.finish();
      }
    });
  }

  // Health check integration
  async healthCheck(): Promise<{
    healthy: boolean;
    initialized: boolean;
    dsn?: string;
    environment?: string;
    lastEventId?: string;
  }> {
    try {
      if (!this.initialized) {
        return {
          healthy: false,
          initialized: false,
        };
      }

      // Send a test message to verify connectivity
      const eventId = this.captureMessage('Health check', 'debug', {
        tags: { type: 'health_check' },
      });

      return {
        healthy: true,
        initialized: true,
        dsn: this.config.dsn ? '***configured***' : undefined,
        environment: this.config.environment,
        lastEventId: eventId,
      };
    } catch (error) {
      console.error('Sentry health check failed:', error);
      return {
        healthy: false,
        initialized: this.initialized,
      };
    }
  }

  // Clerk integration helpers
  setClerkUser(user: User | null): void {
    if (!user) {
      Sentry.setUser(null);
      return;
    }

    this.setUser({
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      username: user.username || undefined,
    });

    this.setContext('clerk_user', {
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      updatedAt: user.updatedAt,
    });
  }

  // API integration helpers
  createAPIErrorHandler() {
    return (error: Error, req: any, res: any, next: any) => {
      const eventId = this.captureException(error, {
        userId: req.user?.id,
        url: req.url,
        userAgent: req.headers['user-agent'],
        extra: {
          method: req.method,
          body: req.method !== 'GET' ? req.body : undefined,
          query: req.query,
          params: req.params,
          headers: this.sanitizeHeaders(req.headers),
        },
        tags: {
          endpoint: req.route?.path || req.url,
          method: req.method,
        },
        level: 'error',
      });

      // Add error ID to response for debugging
      res.setHeader('X-Error-ID', eventId);
      
      if (next) {
        next();
      }
    };
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[Redacted]';
      }
    }
    
    return sanitized;
  }

  // Shutdown cleanup
  async close(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return true;

    try {
      const success = await Sentry.close(timeout);
      console.log('Sentry client closed successfully');
      return success;
    } catch (error) {
      console.error('Error closing Sentry client:', error);
      return false;
    }
  }
}

// Global Sentry instance
let globalSentry: SentryManager | undefined;

export function initializeSentry(config: SentryConfig): SentryManager {
  if (!globalSentry) {
    globalSentry = new SentryManager({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      ...config,
    });
    globalSentry.initialize();
  }
  return globalSentry;
}

export function getSentry(): SentryManager | undefined {
  return globalSentry;
}

// React integration
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryOptions?: any
) {
  if (!globalSentry?.getCurrentHub) {
    return Component;
  }

  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
        <p className="text-red-600 mb-4">
          An error occurred while rendering this component. Our team has been notified.
        </p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-red-700">Error details</summary>
            <pre className="mt-2 p-2 bg-red-100 text-sm overflow-auto">
              {error?.toString()}
            </pre>
          </details>
        )}
      </div>
    ),
    beforeCapture: (scope, error, errorInfo) => {
      scope.setContext('errorBoundary', {
        componentStack: errorInfo?.componentStack,
      });
    },
    ...errorBoundaryOptions,
  });
}

export { Sentry };
export type { ErrorContext, SentryConfig };