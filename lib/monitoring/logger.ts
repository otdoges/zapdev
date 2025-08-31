import { getSentry } from './sentry-config';
import { createId } from '@paralleldrive/cuid2';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  tags?: Record<string, string>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  error?: Error;
  duration?: number;
  metadata?: {
    file?: string;
    function?: string;
    line?: number;
    stack?: string;
  };
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableSentry: boolean;
  enableFile: boolean;
  enableDatabase: boolean;
  maxLogSize: number;
  rotateInterval: number;
  includeStack: boolean;
  redactSensitive: boolean;
}

export class StructuredLogger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'apiKey',
    'authorization',
    'cookie',
    'sessionId',
    'ssn',
    'creditCard',
    'email', // Partially redact
    'phone', // Partially redact
  ];

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO,
      enableConsole: process.env.NODE_ENV !== 'test',
      enableSentry: process.env.SENTRY_DSN !== undefined,
      enableFile: process.env.LOG_TO_FILE === 'true',
      enableDatabase: process.env.LOG_TO_DATABASE === 'true',
      maxLogSize: 1000,
      rotateInterval: 60000, // 1 minute
      includeStack: process.env.NODE_ENV === 'development',
      redactSensitive: process.env.NODE_ENV === 'production',
      ...config,
    };

    this.startLogRotation();
  }

  private startLogRotation(): void {
    setInterval(() => {
      if (this.logBuffer.length > this.config.maxLogSize) {
        // Keep only the most recent logs
        this.logBuffer = this.logBuffer.slice(-this.config.maxLogSize);
      }
    }, this.config.rotateInterval);
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    metadata?: Partial<LogEntry['metadata']>
  ): LogEntry {
    const entry: LogEntry = {
      id: createId(),
      timestamp: new Date(),
      level,
      message,
      context: this.config.redactSensitive ? this.redactSensitiveData(context) : context,
      error,
      metadata: {
        ...metadata,
        ...(this.config.includeStack && error && { stack: error.stack }),
      },
    };

    // Add caller information if available
    if (this.config.includeStack) {
      const stack = new Error().stack;
      if (stack) {
        const caller = this.extractCallerInfo(stack);
        entry.metadata = { ...entry.metadata, ...caller };
      }
    }

    return entry;
  }

  private extractCallerInfo(stack: string): { file?: string; function?: string; line?: number } {
    const lines = stack.split('\n');
    // Skip the first few lines (Error constructor, this method, log method)
    const callerLine = lines[4];
    
    if (callerLine) {
      const match = callerLine.match(/at (.+) \((.+):(\d+):\d+\)/);
      if (match) {
        return {
          function: match[1],
          file: match[2],
          line: parseInt(match[3]),
        };
      }
    }

    return {};
  }

  private redactSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const redacted = { ...obj };

    for (const [key, value] of Object.entries(redacted)) {
      const lowerKey = key.toLowerCase();
      
      if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
        if (lowerKey.includes('email')) {
          // Partially redact email
          redacted[key] = typeof value === 'string' 
            ? value.replace(/(.{2}).+@(.+)/, '$1***@$2')
            : '[REDACTED]';
        } else if (lowerKey.includes('phone')) {
          // Partially redact phone
          redacted[key] = typeof value === 'string'
            ? value.replace(/(\d{3})\d+(\d{4})/, '$1***$2')
            : '[REDACTED]';
        } else {
          redacted[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object') {
        redacted[key] = this.redactSensitiveData(value);
      }
    }

    return redacted;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private writeToOutputs(entry: LogEntry): void {
    // Add to buffer
    this.logBuffer.push(entry);

    // Console output
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    // Sentry output
    if (this.config.enableSentry && (entry.level >= LogLevel.WARN || entry.error)) {
      this.writeToSentry(entry);
    }

    // File output
    if (this.config.enableFile) {
      this.writeToFile(entry);
    }

    // Database output
    if (this.config.enableDatabase) {
      this.writeToDatabase(entry);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    const message = entry.message;
    const prefix = `[${timestamp}] ${level}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, entry.context);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, message, entry.context, entry.error);
        if (entry.error?.stack && this.config.includeStack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  private writeToSentry(entry: LogEntry): void {
    const sentry = getSentry();
    if (!sentry) return;

    try {
      if (entry.error) {
        sentry.captureException(entry.error, {
          level: this.mapLogLevelToSentry(entry.level),
          tags: entry.tags,
          extra: {
            logId: entry.id,
            context: entry.context,
            metadata: entry.metadata,
          },
          userId: entry.userId,
        });
      } else {
        sentry.captureMessage(entry.message, this.mapLogLevelToSentry(entry.level), {
          tags: entry.tags,
          extra: {
            logId: entry.id,
            context: entry.context,
            metadata: entry.metadata,
          },
          userId: entry.userId,
        });
      }
    } catch (error) {
      console.error('Failed to send log to Sentry:', error);
    }
  }

  private mapLogLevelToSentry(level: LogLevel): any {
    switch (level) {
      case LogLevel.DEBUG: return 'debug';
      case LogLevel.INFO: return 'info';
      case LogLevel.WARN: return 'warning';
      case LogLevel.ERROR: return 'error';
      case LogLevel.FATAL: return 'fatal';
      default: return 'info';
    }
  }

  private writeToFile(entry: LogEntry): void {
    // File logging implementation would go here
    // This could write to rotating log files
    try {
      const logLine = JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: LogLevel[entry.level],
        message: entry.message,
        context: entry.context,
        metadata: entry.metadata,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        } : undefined,
      }) + '\n';

      // In a real implementation, you'd write to a file system
      // For now, we'll just store it in memory
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  private writeToDatabase(entry: LogEntry): void {
    // Database logging implementation would go here
    // This could store logs in the database for querying
    try {
      // In a real implementation, you'd use your database connection
      // to store the log entry
    } catch (error) {
      console.error('Failed to write log to database:', error);
    }
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.writeToOutputs(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.writeToOutputs(entry);
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context, error);
    this.writeToOutputs(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.writeToOutputs(entry);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, error);
    this.writeToOutputs(entry);
  }

  // Contextual logging
  child(context: Record<string, any>): ContextualLogger {
    return new ContextualLogger(this, context);
  }

  // Performance logging
  time<T>(label: string, operation: () => T | Promise<T>, context?: Record<string, any>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      
      this.debug(`Starting operation: ${label}`, { ...context, startTime });
      
      try {
        const result = await operation();
        const duration = performance.now() - startTime;
        
        this.info(`Operation completed: ${label}`, {
          ...context,
          duration: `${duration.toFixed(2)}ms`,
          success: true,
        });
        
        resolve(result);
      } catch (error) {
        const duration = performance.now() - startTime;
        
        this.error(`Operation failed: ${label}`, error as Error, {
          ...context,
          duration: `${duration.toFixed(2)}ms`,
          success: false,
        });
        
        reject(error);
      }
    });
  }

  // Query logs
  getLogs(filters?: {
    level?: LogLevel;
    startTime?: Date;
    endTime?: Date;
    userId?: string;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logBuffer];

    if (filters) {
      if (filters.level !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.level >= filters.level!);
      }
      
      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!);
      }
      
      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!);
      }
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  // Statistics
  getStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    recentErrors: number;
    memoryUsage: string;
  } {
    const logsByLevel: Record<string, number> = {};
    const recentThreshold = new Date(Date.now() - 60 * 60 * 1000); // Last hour
    let recentErrors = 0;

    for (const log of this.logBuffer) {
      const levelName = LogLevel[log.level];
      logsByLevel[levelName] = (logsByLevel[levelName] || 0) + 1;
      
      if (log.level >= LogLevel.ERROR && log.timestamp >= recentThreshold) {
        recentErrors++;
      }
    }

    const memoryUsage = `${(JSON.stringify(this.logBuffer).length / 1024 / 1024).toFixed(2)} MB`;

    return {
      totalLogs: this.logBuffer.length,
      logsByLevel,
      recentErrors,
      memoryUsage,
    };
  }

  // Health check
  healthCheck(): {
    healthy: boolean;
    config: LoggerConfig;
    stats: any;
    lastError?: string;
  } {
    const stats = this.getStats();
    
    // Check if there are too many recent errors
    const healthy = stats.recentErrors < 10; // Threshold

    let lastError;
    const errorLogs = this.getLogs({ level: LogLevel.ERROR, limit: 1 });
    if (errorLogs.length > 0) {
      lastError = errorLogs[0].message;
    }

    return {
      healthy,
      config: this.config,
      stats,
      lastError,
    };
  }

  // Cleanup
  clear(): void {
    this.logBuffer = [];
  }

  flush(): Promise<void> {
    // In a real implementation, this would ensure all logs are written
    // to their respective outputs before returning
    return Promise.resolve();
  }
}

// Contextual logger for maintaining context across multiple log calls
export class ContextualLogger {
  constructor(
    private parent: StructuredLogger,
    private context: Record<string, any>
  ) {}

  private mergeContext(additionalContext?: Record<string, any>): Record<string, any> {
    return { ...this.context, ...additionalContext };
  }

  debug(message: string, context?: Record<string, any>): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: Record<string, any>): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.parent.warn(message, this.mergeContext(context), error);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.parent.error(message, error, this.mergeContext(context));
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.parent.fatal(message, error, this.mergeContext(context));
  }

  child(additionalContext: Record<string, any>): ContextualLogger {
    return new ContextualLogger(this.parent, this.mergeContext(additionalContext));
  }

  time<T>(label: string, operation: () => T | Promise<T>, context?: Record<string, any>): Promise<T> {
    return this.parent.time(label, operation, this.mergeContext(context));
  }
}

// Global logger instance
let globalLogger: StructuredLogger | undefined;

export function initializeLogger(config?: Partial<LoggerConfig>): StructuredLogger {
  if (!globalLogger) {
    globalLogger = new StructuredLogger(config);
  }
  return globalLogger;
}

export function getLogger(): StructuredLogger {
  if (!globalLogger) {
    globalLogger = new StructuredLogger();
  }
  return globalLogger;
}

// Convenience exports
export const logger = {
  debug: (message: string, context?: Record<string, any>) => getLogger().debug(message, context),
  info: (message: string, context?: Record<string, any>) => getLogger().info(message, context),
  warn: (message: string, context?: Record<string, any>, error?: Error) => getLogger().warn(message, context, error),
  error: (message: string, error?: Error, context?: Record<string, any>) => getLogger().error(message, error, context),
  fatal: (message: string, error?: Error, context?: Record<string, any>) => getLogger().fatal(message, error, context),
  child: (context: Record<string, any>) => getLogger().child(context),
  time: <T>(label: string, operation: () => T | Promise<T>, context?: Record<string, any>) => 
    getLogger().time(label, operation, context),
};