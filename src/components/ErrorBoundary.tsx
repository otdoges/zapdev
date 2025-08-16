import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as Sentry from '@sentry/react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isDetailsOpen: boolean;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isDetailsOpen: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = Math.random().toString(36).substring(2, 15);
    
    this.setState({
      errorInfo,
      errorId,
    });

    // Log to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', true);
      scope.setTag('level', this.props.level || 'component');
      scope.setLevel('error');
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
        retryCount: this.retryCount,
      });
      Sentry.captureException(error);
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isDetailsOpen: false,
      });
      toast.success(`Retrying... (${this.retryCount}/${this.maxRetries})`);
    } else {
      toast.error('Maximum retry attempts reached');
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  copyErrorDetails = async () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      this.setState({ copied: true });
      toast.success('Error details copied to clipboard');
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (error) {
      toast.error('Failed to copy error details');
    }
  };

  render() {
    if (this.state.hasError) {
      const { level = 'component', showDetails = true } = this.props;
      const isPageLevel = level === 'page';
      const isCritical = level === 'critical';

      const errorContent = (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center justify-center ${
            isPageLevel ? 'min-h-screen p-6 bg-[var(--color-chat-bg)]' : 'p-4'
          }`}
        >
          <Card className={`glass-elevated max-w-2xl w-full ${
            isCritical ? 'border-destructive/50' : 'border-white/20'
          }`}>
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isCritical 
                    ? 'bg-destructive/20 text-destructive' 
                    : 'bg-orange-500/20 text-orange-500'
                }`}>
                  <AlertTriangle className="w-8 h-8" />
                </div>
              </motion.div>

              <CardTitle className="text-2xl font-bold mb-2">
                {isCritical ? 'Critical Error' : 'Something went wrong'}
              </CardTitle>
              
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  {isCritical 
                    ? 'A critical error occurred that requires immediate attention.'
                    : 'We encountered an unexpected error. This has been logged and our team has been notified.'
                  }
                </p>
                
                {this.state.errorId && (
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      Error ID: {this.state.errorId}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error message */}
              {this.state.error?.message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 glass rounded-lg"
                >
                  <h4 className="font-semibold text-sm mb-2 text-destructive">Error Message:</h4>
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                {!isCritical && this.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className="button-gradient flex-1"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </Button>
                )}

                {isPageLevel && (
                  <Button
                    onClick={this.handleGoHome}
                    variant="glass"
                    className="flex-1"
                    leftIcon={<Home className="w-4 h-4" />}
                  >
                    Go Home
                  </Button>
                )}

                {!isPageLevel && (
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex-1"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Reload Page
                  </Button>
                )}
              </motion.div>

              {/* Error details (collapsible) */}
              {showDetails && (this.state.error?.stack || this.state.errorInfo) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Collapsible 
                    open={this.state.isDetailsOpen} 
                    onOpenChange={(isOpen) => this.setState({ isDetailsOpen: isOpen })}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Bug className="w-4 h-4 mr-2" />
                        {this.state.isDetailsOpen ? 'Hide' : 'Show'} Technical Details
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-sm">Technical Details</h4>
                          <Button
                            onClick={this.copyErrorDetails}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            {this.state.copied ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" />
                                Copy Details
                              </>
                            )}
                          </Button>
                        </div>

                        {this.state.error?.stack && (
                          <div className="p-3 bg-black/20 rounded border border-white/10">
                            <h5 className="font-semibold text-xs mb-2 text-destructive">Stack Trace:</h5>
                            <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}

                        {this.state.errorInfo?.componentStack && (
                          <div className="p-3 bg-black/20 rounded border border-white/10">
                            <h5 className="font-semibold text-xs mb-2 text-orange-400">Component Stack:</h5>
                            <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              )}

              {/* Development only information */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                >
                  <p className="text-xs text-yellow-400 font-medium">
                    🚧 Development Mode: Check console for additional error details
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      );

      // If a fallback is provided, use it instead
      if (this.props.fallback) {
        return (
          <AnimatePresence mode="wait">
            {this.props.fallback}
          </AnimatePresence>
        );
      }

      return (
        <AnimatePresence mode="wait">
          {errorContent}
        </AnimatePresence>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="page" />
);

export const ComponentErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="component" />
);

export const CriticalErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="critical" />
);

export default ErrorBoundary;