import * as Sentry from '@sentry/react';
import { toast } from 'sonner';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN',
  USER_INPUT = 'USER_INPUT',
  SYSTEM = 'SYSTEM'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  additionalData?: Record<string, any>;
  timestamp?: number;
  userAgent?: string;
  url?: string;
}

export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  statusCode?: number;
  context?: ErrorContext;
  isRetryable?: boolean;
  userMessage?: string;
  technicalMessage?: string;
}

// Enhanced error class
export class EnhancedError extends Error implements AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  statusCode?: number;
  context?: ErrorContext;
  isRetryable: boolean;
  userMessage: string;
  technicalMessage: string;

  constructor({
    message,
    type = ErrorType.UNKNOWN,
    severity = ErrorSeverity.MEDIUM,
    code,
    statusCode,
    context,
    isRetryable = false,
    userMessage,
    technicalMessage,
    cause
  }: {
    message: string;
    type?: ErrorType;
    severity?: ErrorSeverity;
    code?: string;
    statusCode?: number;
    context?: ErrorContext;
    isRetryable?: boolean;
    userMessage?: string;
    technicalMessage?: string;
    cause?: Error;
  }) {
    super(message, { cause });
    this.name = 'EnhancedError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.statusCode = statusCode;
    this.context = {
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...context
    };
    this.isRetryable = isRetryable;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.technicalMessage = technicalMessage || message;
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return 'Network connection error. Please check your internet connection and try again.';
      case ErrorType.API:
        return 'Service temporarily unavailable. Please try again in a moment.';
      case ErrorType.AUTHENTICATION:
        return 'Please sign in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.SERVICE_UNAVAILABLE:
        return 'This service is currently unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      isRetryable: this.isRetryable,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      stack: this.stack
    };
  }
}

// Error handler class
class ErrorHandler {
  private errorQueue: AppError[] = [];
  private isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
  
  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkStatusHandlers();
  }

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      const error = new EnhancedError({
        message: event.message || 'Uncaught error',
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: {
          component: 'Global',
          action: 'uncaught-error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      });
      this.handleError(error, { silent: true });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = new EnhancedError({
        message: event.reason?.message || 'Unhandled promise rejection',
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: {
          component: 'Global',
          action: 'unhandled-rejection',
          additionalData: {
            reason: event.reason
          }
        }
      });
      this.handleError(error, { silent: true });
    });
  }

  private setupNetworkStatusHandlers() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processErrorQueue();
      toast.success('Connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.error('Connection lost. Some features may be unavailable.');
    });
  }

  // Main error handling method
  public handleError(
    error: Error | AppError, 
    options: {
      context?: ErrorContext;
      showToast?: boolean;
      silent?: boolean;
      reportToSentry?: boolean;
    } = {}
  ): void {
    const {
      context = {},
      showToast = true,
      silent = false,
      reportToSentry = true
    } = options;

    // Convert to EnhancedError if needed
    let enhancedError: AppError;
    if (error instanceof EnhancedError) {
      enhancedError = error;
      // Merge additional context
      enhancedError.context = { ...enhancedError.context, ...context };
    } else {
      enhancedError = this.categorizeError(error, context);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorHandler:', enhancedError);
    }

    // Show user notification unless silent
    if (!silent && showToast) {
      this.showUserNotification(enhancedError);
    }

    // Report to Sentry
    if (reportToSentry && this.isOnline) {
      this.reportToSentry(enhancedError);
    } else if (reportToSentry && !this.isOnline) {
      // Queue for later if offline
      this.errorQueue.push(enhancedError);
    }
  }

  // Categorize errors based on common patterns
  private categorizeError(error: Error, context: ErrorContext = {}): AppError {
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let isRetryable = false;
    let statusCode: number | undefined;

    // Network errors
    if (error.message.includes('fetch') || error.message.includes('Network')) {
      type = ErrorType.NETWORK;
      isRetryable = true;
    }

    // API errors (check for common HTTP status codes)
    if (error.message.includes('401')) {
      type = ErrorType.AUTHENTICATION;
      statusCode = 401;
    } else if (error.message.includes('403')) {
      type = ErrorType.AUTHORIZATION;
      statusCode = 403;
    } else if (error.message.includes('429')) {
      type = ErrorType.RATE_LIMIT;
      statusCode = 429;
      isRetryable = true;
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      type = ErrorType.SERVICE_UNAVAILABLE;
      severity = ErrorSeverity.HIGH;
      statusCode = parseInt(error.message.match(/\d{3}/)?.[0] || '500');
      isRetryable = true;
    }

    // Validation errors
    if (error.message.toLowerCase().includes('validation') || 
        error.message.toLowerCase().includes('invalid')) {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
    }

    return new EnhancedError({
      message: error.message,
      type,
      severity,
      statusCode,
      context,
      isRetryable,
      cause: error
    });
  }

  // Show user-friendly notifications
  private showUserNotification(error: AppError): void {
    const toastOptions = {
      duration: this.getToastDuration(error.severity),
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        toast.info(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.MEDIUM:
        toast.error(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.HIGH:
        toast.error(error.userMessage, {
          ...toastOptions,
          action: error.isRetryable ? {
            label: 'Retry',
            onClick: () => this.triggerRetry(error)
          } : undefined
        });
        break;
      case ErrorSeverity.CRITICAL:
        toast.error(error.userMessage, {
          duration: Infinity,
          action: {
            label: 'Report Issue',
            onClick: () => this.reportIssue(error)
          }
        });
        break;
    }
  }

  private getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW: return 3000;
      case ErrorSeverity.MEDIUM: return 5000;
      case ErrorSeverity.HIGH: return 7000;
      case ErrorSeverity.CRITICAL: return Infinity;
      default: return 5000;
    }
  }

  private triggerRetry(error: AppError): void {
    // This would trigger a retry mechanism
    // Implementation depends on the specific context
    toast.info('Retrying...');
  }

  private reportIssue(error: AppError): void {
    // Generate issue report
    const report = {
      errorId: Math.random().toString(36).substring(2, 15),
      error: error.toJSON(),
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard for user to share
    navigator.clipboard.writeText(JSON.stringify(report, null, 2))
      .then(() => {
        toast.success('Error report copied to clipboard. Please share this with support.');
      })
      .catch(() => {
        toast.error('Failed to copy error report.');
      });
  }

  private reportToSentry(error: AppError): void {
    Sentry.withScope((scope) => {
      // Set error context
      scope.setTag('errorType', error.type);
      scope.setLevel(this.getSentryLevel(error.severity));
      scope.setContext('errorDetails', {
        code: error.code,
        statusCode: error.statusCode,
        isRetryable: error.isRetryable,
        userMessage: error.userMessage,
        technicalMessage: error.technicalMessage
      });

      if (error.context) {
        scope.setContext('appContext', error.context);
        if (error.context.userId) {
          scope.setUser({ id: error.context.userId });
        }
      }

      Sentry.captureException(error);
    });
  }

  private getSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
    switch (severity) {
      case ErrorSeverity.LOW: return 'info';
      case ErrorSeverity.MEDIUM: return 'warning';
      case ErrorSeverity.HIGH: return 'error';
      case ErrorSeverity.CRITICAL: return 'fatal';
      default: return 'error';
    }
  }

  private processErrorQueue(): void {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    errors.forEach(error => {
      this.reportToSentry(error);
    });

    toast.success(`Uploaded ${errors.length} offline error reports`);
  }

  // Utility methods for specific error types
  public handleNetworkError(error: Error, context?: ErrorContext): void {
    const networkError = new EnhancedError({
      message: error.message,
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      context,
      isRetryable: true
    });
    this.handleError(networkError);
  }

  public handleAPIError(error: Error, statusCode?: number, context?: ErrorContext): void {
    const apiError = new EnhancedError({
      message: error.message,
      type: ErrorType.API,
      severity: statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      statusCode,
      context,
      isRetryable: statusCode ? statusCode >= 500 || statusCode === 429 : false
    });
    this.handleError(apiError);
  }

  public handleValidationError(message: string, context?: ErrorContext): void {
    const validationError = new EnhancedError({
      message,
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      context,
      isRetryable: false,
      userMessage: message // Show validation messages directly to user
    });
    this.handleError(validationError, { reportToSentry: false }); // Don't spam Sentry with validation errors
  }

  // Check if service is healthy
  public async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      // This would ping the service health endpoint
      // Implementation depends on your backend setup
      return true;
    } catch (error) {
      this.handleError(new EnhancedError({
        message: `${serviceName} service health check failed`,
        type: ErrorType.SERVICE_UNAVAILABLE,
        severity: ErrorSeverity.HIGH,
        context: { component: serviceName, action: 'health-check' }
      }));
      return false;
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Logger interface for simple console logging with error handling
export const logger = {
  error: (message: string, error?: any) => {
    console.error(message, error);
    if (error instanceof Error) {
      errorHandler.handleError(error, { 
        context: { action: 'logger.error', additionalData: { message } },
        showToast: false,
        reportToSentry: true
      });
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(message, data);
  },
  info: (message: string, data?: any) => {
    console.info(message, data);
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, data);
    }
  }
};

// Utility functions for easy usage
export const handleError = (error: Error | AppError, options?: Parameters<typeof errorHandler.handleError>[1]) => {
  errorHandler.handleError(error, options);
};

export const handleNetworkError = (error: Error, context?: ErrorContext) => {
  errorHandler.handleNetworkError(error, context);
};

export const handleAPIError = (error: Error, statusCode?: number, context?: ErrorContext) => {
  errorHandler.handleAPIError(error, statusCode, context);
};

export const handleValidationError = (message: string, context?: ErrorContext) => {
  errorHandler.handleValidationError(message, context);
};

// React hook for error handling in components
export const useErrorHandler = () => {
  return {
    handleError: (error: Error | AppError, options?: Parameters<typeof errorHandler.handleError>[1]) => {
      errorHandler.handleError(error, options);
    },
    handleNetworkError: (error: Error, context?: ErrorContext) => {
      errorHandler.handleNetworkError(error, context);
    },
    handleAPIError: (error: Error, statusCode?: number, context?: ErrorContext) => {
      errorHandler.handleAPIError(error, statusCode, context);
    },
    handleValidationError: (message: string, context?: ErrorContext) => {
      errorHandler.handleValidationError(message, context);
    }
  };
};