/**
 * Security and Input Validation Utilities
 * Extracted from EnhancedChatInterface for better security management
 */

// Security constants for input validation
export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_RESPONSE_LENGTH = 50000; // Maximum AI response length
export const MAX_TITLE_LENGTH = 100;
export const MIN_TITLE_LENGTH = 1;

// XSS protection: sanitize text input
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#x27;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        default: return char;
      }
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

// Validate AI response content
export const validateResponse = (content: string): { isValid: boolean; error?: string } => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Response must be a non-empty string' };
  }
  
  if (content.trim().length === 0) {
    return { isValid: false, error: 'Response cannot be empty or only whitespace' };
  }
  
  if (content.length > MAX_RESPONSE_LENGTH) {
    return { isValid: false, error: `Response exceeds maximum length of ${MAX_RESPONSE_LENGTH} characters` };
  }
  
  // Check for potentially malicious patterns
  const maliciousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script[^<]*>/is,
    /\bjavascript:/i,
    // quoted or unquoted inline handlers
    /\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/is,
    /<object[^>]*>[\s\S]*?<\/object>/is,
    /<embed[^>]*>/i,
    // restrict risky data URI media types commonly used for HTML/script delivery
    /\bdata:(?:text\/html|application\/xhtml\+xml|image\/svg\+xml)/i,
    /\bvbscript:/i
  ];

  const hasMaliciousPattern = maliciousPatterns.some(pattern => pattern.test(content));
  if (hasMaliciousPattern) {
    return { isValid: false, error: 'Response contains potentially unsafe content' };
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