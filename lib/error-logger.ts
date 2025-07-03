/**
 * Centralized error logging utility for consistent error tracking across the application
 */

export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  API = 'api',
  AUTH = 'auth',
  DATABASE = 'database',
  AI_MODEL = 'ai_model',
  WEBCONTAINER = 'webcontainer',
  PAYMENT = 'payment',
  GENERAL = 'general',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  error?: Error;
  context?: ErrorContext;
  stack?: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with consistent formatting
   */
  log(
    level: ErrorLevel,
    category: ErrorCategory,
    message: string,
    error?: Error | unknown,
    context?: ErrorContext
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
    };

    // Handle different error types
    if (error instanceof Error) {
      logEntry.error = error;
      logEntry.stack = error.stack;
    } else if (error) {
      logEntry.error = new Error(String(error));
    }

    // In development, log to console with formatting
    if (this.isDevelopment) {
      this.logToConsole(logEntry);
    }

    // In production, send to monitoring service
    if (!this.isDevelopment) {
      this.sendToMonitoring(logEntry);
    }

    // Always log critical errors
    if (level === ErrorLevel.CRITICAL) {
      this.alertTeam(logEntry);
    }
  }

  // Flexible convenience methods ----------------------------------
  private buildLogParams(
    message: string,
    extras: any[]
  ): { fullMessage: string; error?: Error | unknown; context?: ErrorContext } {
    let error: Error | unknown | undefined;
    let context: ErrorContext | undefined;
    const messageParts: any[] = [];

    extras.forEach((item) => {
      if (item instanceof Error && !error) {
        error = item;
      } else if (
        typeof item === 'object' &&
        item !== null &&
        !Array.isArray(item) &&
        !(item instanceof Error) &&
        !context
      ) {
        context = item as ErrorContext;
      } else {
        messageParts.push(item);
      }
    });

    const fullMessage = [message, ...messageParts.map(String)].join(' ');
    return { fullMessage, error, context };
  }

  debug(category: ErrorCategory, message: string, ...extras: any[]): void {
    const { fullMessage, error, context } = this.buildLogParams(message, extras);
    this.log(ErrorLevel.DEBUG, category, fullMessage, error, context);
  }

  info(category: ErrorCategory, message: string, ...extras: any[]): void {
    const { fullMessage, error, context } = this.buildLogParams(message, extras);
    this.log(ErrorLevel.INFO, category, fullMessage, error, context);
  }

  warning(category: ErrorCategory, message: string, ...extras: any[]): void {
    const { fullMessage, error, context } = this.buildLogParams(message, extras);
    this.log(ErrorLevel.WARNING, category, fullMessage, error, context);
  }

  error(category: ErrorCategory, message: string, ...extras: any[]): void {
    const { fullMessage, error, context } = this.buildLogParams(message, extras);
    this.log(ErrorLevel.ERROR, category, fullMessage, error, context);
  }

  critical(category: ErrorCategory, message: string, ...extras: any[]): void {
    const { fullMessage, error, context } = this.buildLogParams(message, extras);
    this.log(ErrorLevel.CRITICAL, category, fullMessage, error, context);
  }

  /**
   * Log API errors with request details
   */
  logApiError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error | unknown,
    context?: ErrorContext
  ): void {
    const enhancedContext: ErrorContext = {
      ...context,
      endpoint,
      method,
      statusCode,
    };

    const message = `API Error: ${method} ${endpoint} returned ${statusCode}`;
    this.error(ErrorCategory.API, message, error, enhancedContext);
  }

  /**
   * Log AI model errors with model details
   */
  logAiError(
    model: string,
    operation: string,
    error: Error | unknown,
    context?: ErrorContext
  ): void {
    const enhancedContext: ErrorContext = {
      ...context,
      model,
      operation,
    };

    const message = `AI Model Error: ${operation} failed for model ${model}`;
    this.error(ErrorCategory.AI_MODEL, message, error, enhancedContext);
  }

  /**
   * Log authentication errors
   */
  logAuthError(operation: string, error: Error | unknown, context?: ErrorContext): void {
    const message = `Authentication Error: ${operation} failed`;
    this.error(ErrorCategory.AUTH, message, error, context);
  }

  /**
   * Console logging with color coding
   */
  private logToConsole(entry: LogEntry): void {
    const colors = {
      [ErrorLevel.DEBUG]: '\x1b[36m', // Cyan
      [ErrorLevel.INFO]: '\x1b[34m', // Blue
      [ErrorLevel.WARNING]: '\x1b[33m', // Yellow
      [ErrorLevel.ERROR]: '\x1b[31m', // Red
      [ErrorLevel.CRITICAL]: '\x1b[35m', // Magenta
    };

    const color = colors[entry.level] || '\x1b[0m';
    const reset = '\x1b[0m';

    console.log(
      `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]${reset} ${entry.message}`
    );

    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log(`${color}Context:${reset}`, entry.context);
    }

    if (entry.stack) {
      console.log(`${color}Stack:${reset}`, entry.stack);
    }
  }

  /**
   * Send to monitoring service (Sentry, Plausible, etc.)
   */
  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Integrate with Sentry
    // For now, we'll use Plausible if available
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('Error Logged', {
        props: {
          level: entry.level,
          category: entry.category,
          message: entry.message.substring(0, 100), // Limit message length
        }
      });
    }
  }

  /**
   * Alert team for critical errors
   */
  private alertTeam(entry: LogEntry): void {
    // In a real application, this would send alerts via
    // PagerDuty, Slack, email, etc.
    console.error('🚨 CRITICAL ERROR:', entry.message, entry);
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Helper function for React components
export function useErrorLogger() {
  return errorLogger;
}

// Type-safe error boundary error handler
export function logErrorBoundary(error: Error, errorInfo: { componentStack: string }): void {
  errorLogger.critical(ErrorCategory.GENERAL, 'React Error Boundary triggered', error, {
    componentStack: errorInfo.componentStack,
  });
}
