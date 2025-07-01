/**
 * User-friendly error messages and handling
 */

import { ErrorCategory } from './error-logger';

export interface UserFriendlyError {
  userMessage: string;
  technicalMessage: string;
  category: ErrorCategory;
  statusCode: number;
  canRetry: boolean;
  metadata?: Record<string, any>;
}

/**
 * Error message mappings for different categories
 */
const ERROR_MESSAGES: Record<ErrorCategory, {
  default: string;
  statusCode: number;
  canRetry: boolean;
}> = {
  [ErrorCategory.DATABASE]: {
    default: 'We\'re experiencing database issues. Please try again in a moment.',
    statusCode: 503,
    canRetry: true,
  },
  [ErrorCategory.API]: {
    default: 'There was an issue processing your request. Please check your input and try again.',
    statusCode: 400,
    canRetry: false,
  },
  [ErrorCategory.AI_MODEL]: {
    default: 'Our AI service is temporarily unavailable. Please try again shortly.',
    statusCode: 503,
    canRetry: true,
  },
  [ErrorCategory.AUTHENTICATION]: {
    default: 'Please log in to continue.',
    statusCode: 401,
    canRetry: false,
  },
  [ErrorCategory.AUTHORIZATION]: {
    default: 'You don\'t have permission to perform this action.',
    statusCode: 403,
    canRetry: false,
  },
  [ErrorCategory.RATE_LIMIT]: {
    default: 'You\'re making requests too quickly. Please slow down and try again.',
    statusCode: 429,
    canRetry: true,
  },
  [ErrorCategory.VALIDATION]: {
    default: 'Please check your input and try again.',
    statusCode: 400,
    canRetry: false,
  },
  [ErrorCategory.NETWORK]: {
    default: 'Network connection issue. Please check your internet and try again.',
    statusCode: 503,
    canRetry: true,
  },
  [ErrorCategory.FILE_SYSTEM]: {
    default: 'File operation failed. Please try again.',
    statusCode: 500,
    canRetry: true,
  },
  [ErrorCategory.EXTERNAL_SERVICE]: {
    default: 'An external service is currently unavailable. Please try again later.',
    statusCode: 503,
    canRetry: true,
  },
  [ErrorCategory.UNKNOWN]: {
    default: 'Something went wrong. Please try again.',
    statusCode: 500,
    canRetry: true,
  },
};

/**
 * Specific error patterns and their user-friendly messages
 */
const SPECIFIC_ERROR_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
  statusCode?: number;
  canRetry?: boolean;
}> = [
  {
    pattern: /timeout|timed out/i,
    message: 'The request took too long to complete. Please try again.',
    statusCode: 408,
    canRetry: true,
  },
  {
    pattern: /connection refused|network/i,
    message: 'Unable to connect to our services. Please check your internet connection.',
    statusCode: 503,
    canRetry: true,
  },
  {
    pattern: /unauthorized|invalid token/i,
    message: 'Your session has expired. Please log in again.',
    statusCode: 401,
    canRetry: false,
  },
  {
    pattern: /forbidden|access denied/i,
    message: 'You don\'t have permission to access this resource.',
    statusCode: 403,
    canRetry: false,
  },
  {
    pattern: /not found/i,
    message: 'The requested resource was not found.',
    statusCode: 404,
    canRetry: false,
  },
  {
    pattern: /rate limit|too many requests/i,
    message: 'You\'re making requests too quickly. Please wait a moment and try again.',
    statusCode: 429,
    canRetry: true,
  },
  {
    pattern: /validation|invalid input/i,
    message: 'Please check your input and make sure all required fields are filled correctly.',
    statusCode: 400,
    canRetry: false,
  },
  {
    pattern: /file too large|payload too large/i,
    message: 'The file you\'re trying to upload is too large. Please choose a smaller file.',
    statusCode: 413,
    canRetry: false,
  },
];

/**
 * Create a user-friendly error from a technical error
 */
export function createUserFriendlyError(
  error: Error,
  category: ErrorCategory,
  metadata?: Record<string, any>
): UserFriendlyError {
  const categoryDefaults = ERROR_MESSAGES[category];
  
  // Check for specific error patterns
  const specificPattern = SPECIFIC_ERROR_PATTERNS.find(pattern =>
    pattern.pattern.test(error.message)
  );
  
  const userMessage = specificPattern?.message || categoryDefaults.default;
  const statusCode = specificPattern?.statusCode || categoryDefaults.statusCode;
  const canRetry = specificPattern?.canRetry ?? categoryDefaults.canRetry;
  
  return {
    userMessage,
    technicalMessage: error.message,
    category,
    statusCode,
    canRetry,
    metadata,
  };
}

/**
 * Create error response for API endpoints
 */
export function createErrorResponse(
  error: UserFriendlyError,
  includeDetails: boolean = false
): Response {
  const body: any = {
    error: error.userMessage,
    canRetry: error.canRetry,
  };
  
  if (includeDetails) {
    body.category = error.category;
    body.technicalMessage = error.technicalMessage;
    body.metadata = error.metadata;
  }
  
  return new Response(JSON.stringify(body), {
    status: error.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle errors in async operations with user-friendly messages
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  category: ErrorCategory,
  fallbackMessage?: string
): Promise<{ success: true; data: T } | { success: false; error: UserFriendlyError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const userError = createUserFriendlyError(
      error instanceof Error ? error : new Error(fallbackMessage || 'Unknown error'),
      category
    );
    return { success: false, error: userError };
  }
}
