/**
 * Security and Input Validation Utilities
 * Extracted from EnhancedChatInterface for better security management
 */

// Security constants for input validation
export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_TITLE_LENGTH = 100;
export const MIN_TITLE_LENGTH = 1;

// XSS protection: sanitize text input
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>'"&]/g, (char) => {
      const chars: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#x27;',
        '"': '&quot;',
        '&': '&amp;'
      };
      return Object.prototype.hasOwnProperty.call(chars, char) ? chars[char] : char;
    })
    .trim();
};

// Validate input length and content
export const validateInput = (text: string, maxLength: number): { isValid: boolean; error?: string } => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Input must be a non-empty string' };
  }
  
  if (text.trim().length === 0) {
    return { isValid: false, error: 'Input cannot be empty or only whitespace' };
  }
  
  if (text.length > maxLength) {
    return { isValid: false, error: `Input exceeds maximum length of ${maxLength} characters` };
  }
  
  return { isValid: true };
};

// Validate chat title
export const validateChatTitle = (title: string): { isValid: boolean; error?: string } => {
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: 'Title must be a non-empty string' };
  }
  
  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length < MIN_TITLE_LENGTH) {
    return { isValid: false, error: `Title must be at least ${MIN_TITLE_LENGTH} character(s)` };
  }
  
  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return { isValid: false, error: `Title exceeds maximum length of ${MAX_TITLE_LENGTH} characters` };
  }
  
  // Check for potential XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  const hasXSSPattern = xssPatterns.some(pattern => pattern.test(trimmedTitle));
  if (hasXSSPattern) {
    return { isValid: false, error: 'Title contains potentially unsafe content' };
  }
  
  return { isValid: true };
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the time window
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }
  
  getRemainingAttempts(identifier: string): number {
    const userAttempts = this.attempts.get(identifier) || [];
    const now = Date.now();
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}