/**
 * User-friendly error message generator
 * Converts technical errors into helpful messages for users
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestion?: string;
  retryable: boolean;
  technicalDetails?: string;
}

/**
 * Map of error codes to user-friendly messages
 */
const ERROR_MAPPINGS: Record<string, UserFriendlyError> = {
  // Authentication errors
  'auth/invalid-credentials': {
    title: 'Sign in failed',
    message: 'The email or password you entered is incorrect.',
    suggestion: 'Please check your credentials and try again.',
    retryable: true,
  },
  'auth/user-not-found': {
    title: 'Account not found',
    message: "We couldn't find an account with that email address.",
    suggestion: 'Please check the email or sign up for a new account.',
    retryable: true,
  },
  'auth/email-already-in-use': {
    title: 'Email already registered',
    message: 'This email is already associated with an account.',
    suggestion: 'Try signing in instead, or use a different email.',
    retryable: false,
  },
  'auth/weak-password': {
    title: 'Password too weak',
    message: "Your password doesn't meet our security requirements.",
    suggestion: 'Use at least 8 characters with a mix of letters, numbers, and symbols.',
    retryable: true,
  },
  'auth/session-expired': {
    title: 'Session expired',
    message: 'Your session has expired for security reasons.',
    suggestion: 'Please sign in again to continue.',
    retryable: true,
  },

  // API errors
  'api/rate-limit': {
    title: 'Slow down!',
    message: "You're making requests too quickly.",
    suggestion: 'Please wait a moment before trying again.',
    retryable: true,
  },
  'api/validation-error': {
    title: 'Invalid request',
    message: "Some information in your request wasn't formatted correctly.",
    suggestion: 'Please check your input and try again.',
    retryable: true,
  },
  'api/server-error': {
    title: 'Something went wrong',
    message: "We're experiencing technical difficulties.",
    suggestion: 'Please try again in a few moments.',
    retryable: true,
  },
  'api/not-found': {
    title: 'Not found',
    message: "We couldn't find what you're looking for.",
    suggestion: 'It may have been moved or deleted.',
    retryable: false,
  },

  // AI/Model errors
  'ai/model-overloaded': {
    title: 'AI service busy',
    message: 'Our AI models are experiencing high demand.',
    suggestion: 'Please try again in a few moments.',
    retryable: true,
  },
  'ai/context-too-long': {
    title: 'Message too long',
    message: 'Your message exceeds the maximum length.',
    suggestion: 'Try breaking it into smaller parts.',
    retryable: true,
  },
  'ai/generation-failed': {
    title: 'Generation failed',
    message: "The AI couldn't complete your request.",
    suggestion: 'Try rephrasing your request or simplifying it.',
    retryable: true,
  },

  // Database errors
  'db/connection-failed': {
    title: 'Connection issue',
    message: "We're having trouble connecting to our servers.",
    suggestion: 'Check your internet connection and try again.',
    retryable: true,
  },
  'db/save-failed': {
    title: "Couldn't save",
    message: "We couldn't save your changes.",
    suggestion: 'Please try again. Your work has been preserved locally.',
    retryable: true,
  },

  // WebContainer errors
  'webcontainer/init-failed': {
    title: 'Preview unavailable',
    message: "The code preview environment couldn't start.",
    suggestion: 'Try refreshing the page or using a different browser.',
    retryable: true,
  },
  'webcontainer/build-failed': {
    title: 'Build failed',
    message: 'There was an error building your project.',
    suggestion: 'Check the console for specific errors.',
    retryable: true,
  },

  // Payment errors
  'payment/card-declined': {
    title: 'Payment declined',
    message: 'Your card was declined by your bank.',
    suggestion: 'Please try a different payment method.',
    retryable: true,
  },
  'payment/insufficient-funds': {
    title: 'Insufficient funds',
    message: "Your card doesn't have enough funds.",
    suggestion: 'Please try a different payment method.',
    retryable: true,
  },

  // Network errors
  'network/offline': {
    title: 'No internet connection',
    message: 'You appear to be offline.',
    suggestion: 'Check your connection and try again.',
    retryable: true,
  },
  'network/timeout': {
    title: 'Request timed out',
    message: 'The request took too long to complete.',
    suggestion: 'Check your connection and try again.',
    retryable: true,
  },
};

/**
 * Default error message for unknown errors
 */
const DEFAULT_ERROR: UserFriendlyError = {
  title: 'Oops! Something went wrong',
  message: 'We encountered an unexpected error.',
  suggestion: 'Please try again. If the problem persists, contact support.',
  retryable: true,
};

/**
 * Convert an error to a user-friendly message
 */
export function getUserFriendlyError(
  error: Error | unknown,
  errorCode?: string
): UserFriendlyError {
  // If we have a specific error code, use it
  if (errorCode && ERROR_MAPPINGS[errorCode]) {
    const mapping = ERROR_MAPPINGS[errorCode];
    return {
      ...mapping,
      technicalDetails: error instanceof Error ? error.message : String(error),
    };
  }

  // Try to extract error code from the error
  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();

    // Auth errors
    if (message.includes('invalid') && message.includes('credential')) {
      return ERROR_MAPPINGS['auth/invalid-credentials'];
    }
    if (message.includes('user') && message.includes('not found')) {
      return ERROR_MAPPINGS['auth/user-not-found'];
    }
    if (message.includes('rate limit')) {
      return ERROR_MAPPINGS['api/rate-limit'];
    }
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MAPPINGS['network/offline'];
    }
    if (message.includes('timeout')) {
      return ERROR_MAPPINGS['network/timeout'];
    }

    // Check for HTTP status codes
    const statusMatch = message.match(/status[:\s]+(\d{3})/i);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      if (status === 404) return ERROR_MAPPINGS['api/not-found'];
      if (status === 429) return ERROR_MAPPINGS['api/rate-limit'];
      if (status >= 500) return ERROR_MAPPINGS['api/server-error'];
      if (status >= 400) return ERROR_MAPPINGS['api/validation-error'];
    }
  }

  // Return default error with technical details
  return {
    ...DEFAULT_ERROR,
    technicalDetails: error instanceof Error ? error.message : String(error),
  };
}

/**
 * React hook for error messages
 */
export function useUserFriendlyError(
  error: Error | unknown,
  errorCode?: string
): UserFriendlyError | null {
  if (!error) return null;
  return getUserFriendlyError(error, errorCode);
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: UserFriendlyError): {
  icon: string;
  color: string;
  actionLabel: string;
} {
  return {
    icon: error.retryable ? '🔄' : '❌',
    color: error.retryable ? 'yellow' : 'red',
    actionLabel: error.retryable ? 'Try Again' : 'Dismiss',
  };
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  // Retry with exponential backoff
  async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
    let lastError: Error | unknown;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  },

  // Save data locally before retrying
  async saveAndRetry<T>(data: any, key: string, fn: () => Promise<T>): Promise<T> {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `zapdev_recovery_${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    }

    try {
      const result = await fn();
      // Clear saved data on success
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`zapdev_recovery_${key}`);
      }
      return result;
    } catch (error) {
      // Data is saved, can be recovered later
      throw error;
    }
  },

  // Get saved recovery data
  getRecoveryData(key: string): any | null {
    if (typeof window === 'undefined') return null;

    const saved = localStorage.getItem(`zapdev_recovery_${key}`);
    if (!saved) return null;

    try {
      const { data, timestamp } = JSON.parse(saved);
      // Data expires after 24 hours
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`zapdev_recovery_${key}`);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },
};
