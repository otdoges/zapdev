'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { getSentry } from '@/lib/monitoring/sentry-config';
import { getLogger } from '@/lib/monitoring/logger';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: ErrorFallbackProps) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, eventId: string) => void;
  isolate?: boolean;
  showDetails?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'section' | 'component';
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  retry: () => void;
  eventId: string | null;
  retryCount: number;
  maxRetries: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetOnPropsChange && resetOnPropsChange) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const logger = getLogger();
    const sentry = getSentry();

    // Log to our structured logging system
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: {
        level: this.props.level || 'component',
        isolate: this.props.isolate,
        retryCount: this.state.retryCount,
      },
      react: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Send to Sentry
    let eventId: string | null = null;
    if (sentry) {
      sentry.withScope((scope) => {
        scope.setContext('errorBoundary', {
          level: this.props.level || 'component',
          isolate: this.props.isolate,
          retryCount: this.state.retryCount,
          componentStack: errorInfo.componentStack,
        });

        scope.setLevel('error');
        scope.setTag('errorBoundary', true);
        scope.setTag('errorBoundaryLevel', this.props.level || 'component');

        eventId = sentry.captureException(error);
      });
    }

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call custom error handler
    if (this.props.onError && eventId) {
      this.props.onError(error, errorInfo, eventId);
    }
  }

  resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0,
    });
  };

  retry = (): void => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    getLogger().info('Retrying after error boundary catch', {
      retryCount: this.state.retryCount + 1,
      maxRetries,
      error: this.state.error?.message,
    });

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetErrorBoundary,
          retry: this.retry,
          eventId: this.state.eventId,
          retryCount: this.state.retryCount,
          maxRetries: this.props.maxRetries || 3,
        });
      }

      // Use default fallback based on level
      return this.renderDefaultFallback();
    }

    return this.props.children;
  }

  private renderDefaultFallback(): ReactNode {
    const { level = 'component', showDetails = process.env.NODE_ENV === 'development' } = this.props;
    const { error, eventId, retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    const levelConfig = {
      page: {
        title: 'Page Error',
        description: 'Something went wrong with this page. Our team has been notified and is working on a fix.',
        showHome: true,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: AlertTriangle,
      },
      section: {
        title: 'Section Error',
        description: 'This section encountered an error. You can try refreshing or continue using other parts of the app.',
        showHome: false,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        icon: Bug,
      },
      component: {
        title: 'Component Error',
        description: 'A component failed to load properly.',
        showHome: false,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        icon: AlertTriangle,
      },
    };

    const config = levelConfig[level];
    const Icon = config.icon;

    return (
      <div className={`p-6 ${config.bgColor} border ${config.borderColor} rounded-lg m-4`}>
        <div className="flex items-start space-x-4">
          <Icon className={`w-6 h-6 ${config.textColor} flex-shrink-0 mt-1`} />
          
          <div className="flex-1">
            <h2 className={`text-lg font-semibold ${config.textColor} mb-2`}>
              {config.title}
            </h2>
            
            <p className={`${config.textColor.replace('800', '700')} mb-4`}>
              {config.description}
            </p>

            {eventId && (
              <p className={`text-sm ${config.textColor.replace('800', '600')} mb-4`}>
                Error ID: <code className="bg-white bg-opacity-50 px-1 rounded">{eventId}</code>
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {retryCount < maxRetries && (
                <button
                  onClick={this.retry}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-current rounded hover:bg-opacity-80 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again ({maxRetries - retryCount} left)</span>
                </button>
              )}

              <button
                onClick={this.resetErrorBoundary}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-current rounded hover:bg-opacity-80 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>

              {config.showHome && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-current rounded hover:bg-opacity-80 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Go Home</span>
                </button>
              )}

              <button
                onClick={() => window.location.href = 'mailto:support@zapdev.com?subject=Error Report&body=' + 
                  encodeURIComponent(`Error ID: ${eventId}\nError: ${error?.message}\nURL: ${window.location.href}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-current rounded hover:bg-opacity-80 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Report Issue</span>
              </button>
            </div>

            {showDetails && error && (
              <details className="mt-4">
                <summary className={`cursor-pointer ${config.textColor} font-medium`}>
                  Technical Details
                </summary>
                
                <div className="mt-2 p-3 bg-white bg-opacity-50 rounded text-sm">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.name}
                  </div>
                  
                  <div className="mb-2">
                    <strong>Message:</strong> {error.message}
                  </div>
                  
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 p-2 bg-gray-100 text-xs overflow-auto rounded">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-2">
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 p-2 bg-gray-100 text-xs overflow-auto rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// Specific error boundary components for different levels
export const PageErrorBoundary: React.FC<Pick<ErrorBoundaryProps, 'children' | 'fallback' | 'onError'>> = ({ 
  children, 
  fallback, 
  onError 
}) => (
  <ErrorBoundary level="page" showDetails={false} maxRetries={2} fallback={fallback} onError={onError}>
    {children}
  </ErrorBoundary>
);

export const SectionErrorBoundary: React.FC<Pick<ErrorBoundaryProps, 'children' | 'fallback' | 'onError'>> = ({ 
  children, 
  fallback, 
  onError 
}) => (
  <ErrorBoundary level="section" showDetails={false} maxRetries={3} fallback={fallback} onError={onError}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<Pick<ErrorBoundaryProps, 'children' | 'fallback' | 'onError'>> = ({ 
  children, 
  fallback, 
  onError 
}) => (
  <ErrorBoundary level="component" showDetails={false} maxRetries={1} fallback={fallback} onError={onError}>
    {children}
  </ErrorBoundary>
);

// Async error boundary for handling promise rejections
export class AsyncErrorBoundary extends Component<
  ErrorBoundaryProps & { onUnhandledRejection?: (event: PromiseRejectionEvent) => void },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { onUnhandledRejection?: (event: PromiseRejectionEvent) => void }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0,
    };
  }

  componentDidMount(): void {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount(): void {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));

    const logger = getLogger();
    const sentry = getSentry();

    // Log unhandled promise rejection
    logger.error('Unhandled Promise Rejection', error, {
      type: 'unhandledRejection',
      reason: event.reason,
    });

    // Send to Sentry
    let eventId: string | null = null;
    if (sentry) {
      eventId = sentry.captureException(error, {
        tags: { type: 'unhandledRejection' },
        extra: { reason: event.reason },
      });
    }

    // Update state to show error
    this.setState({
      hasError: true,
      error,
      errorInfo: null,
      eventId,
    });

    if (this.props.onUnhandledRejection) {
      this.props.onUnhandledRejection(event);
    }
  };

  render(): ReactNode {
    return <ErrorBoundary {...this.props}>{this.props.children}</ErrorBoundary>;
  }
}

export default ErrorBoundary;