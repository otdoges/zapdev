/**
 * Security utilities and input validation
 * Note: Client-side security should complement, not replace, server-side validation
 */

/**
 * HTML Sanitization using DOMPurify pattern
 * For production, use actual DOMPurify library: npm install dompurify @types/dompurify
 */
export const sanitizeHTML = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Basic HTML entity escaping for contexts where HTML is not allowed
  // For rich text, use DOMPurify instead
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Sanitize for HTML attribute context
 */
export const sanitizeAttribute = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Escape quotes and remove any control characters
  return input
    .replace(/[^\w\s-]/g, '')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Sanitize for URL context
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase().trim();
  
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    return '';
  }

  try {
    const parsed = new URL(url);
    // Only allow http(s) and mailto
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    // If not a valid URL, treat as relative path
    // Remove any potentially dangerous characters
    return url.replace(/[<>"']/g, '');
  }
};

/**
 * Email validation with proper RFC compliance
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  
  // More comprehensive email regex based on RFC 5322 - using safe character classes
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * URL validation
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || url.length > 2048) return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Username validation
 */
export const isValidUsername = (username: string): boolean => {
  if (!username || username.length < 3 || username.length > 30) {
    return false;
  }
  
  // Allow alphanumeric, underscores, hyphens, and dots
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  return usernameRegex.test(username);
};

/**
 * Password strength validation
 */
export const validatePassword = (password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { valid: false, score: 0, feedback: ['Password is required'] };
  }

  // Length checks
  if (password.length < 8) {
    feedback.push('At least 8 characters required');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Complexity checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Common patterns to avoid
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score -= 1;
  }

  if (/^(password|12345678|qwerty)/i.test(password)) {
    feedback.push('Avoid common passwords');
    score = 0;
  }

  return {
    valid: score >= 4,
    score: Math.max(0, Math.min(score, 5)),
    feedback
  };
};

/**
 * Rate limiting for client-side operations
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxMapSize = 1000; // Prevent memory leaks

  isAllowed(
    key: string,
    windowMs: number = 60000,
    maxRequests: number = 10
  ): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    let userRequests = this.requests.get(key) || [];
    
    // Filter to only requests within the window
    userRequests = userRequests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (userRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    userRequests.push(now);
    this.requests.set(key, userRequests);
    
    // Prevent map from growing too large
    if (this.requests.size > this.maxMapSize) {
      this.cleanup();
    }
    
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    
    for (const [key, times] of this.requests.entries()) {
      const validTimes = times.filter(time => now - time < maxAge);
      if (validTimes.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimes);
      }
    }
    
    // If still too large, remove oldest entries
    if (this.requests.size > this.maxMapSize) {
      const entries = Array.from(this.requests.entries());
      const toRemove = entries
        .sort((a, b) => Math.max(...a[1]) - Math.max(...b[1]))
        .slice(0, Math.floor(this.maxMapSize / 2));
      
      toRemove.forEach(([key]) => this.requests.delete(key));
    }
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

export const rateLimiter = new RateLimiter();

// Clean up old data periodically
if (typeof window !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

/**
 * Generate cryptographically secure random tokens
 */
export const generateSecureToken = async (length: number = 32): Promise<string> => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  
  return Array.from(values)
    .map(x => charset[x % charset.length])
    .join('');
};

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

/**
 * Hash a string using SHA-256
 */
export const hashString = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Content Security Policy configuration
 * Adjust based on your specific needs
 */
export const getCSPConfig = (nonce?: string) => {
  const config: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Use nonce for inline scripts in production
      nonce ? `'nonce-${nonce}'` : "'unsafe-inline'",
      "https://cdn.jsdelivr.net", // For trusted CDNs
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Often needed for CSS-in-JS
      "https://fonts.googleapis.com",
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "blob:",
    ],
    'connect-src': [
      "'self'",
      // Add your API endpoints here
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  // Add development-specific sources
  if (process.env.NODE_ENV === 'development') {
    config['script-src'].push("'unsafe-eval'"); // For HMR
    config['connect-src'].push("ws://localhost:*", "http://localhost:*");
  }

  return config;
};

/**
 * Generate CSP header string
 */
export const generateCSPHeader = (nonce?: string): string => {
  const config = getCSPConfig(nonce);
  
  return Object.entries(config)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Security headers for production
 */
export const getSecurityHeaders = (nonce?: string): Record<string, string> => {
  return {
    'Content-Security-Policy': generateCSPHeader(nonce),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0', // Disabled in modern browsers, CSP is better
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
};

/**
 * File upload validation
 */
export const validateFileUpload = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
    ],
    allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.txt', '.csv', '.json'
    ]
  } = options;

  // Check file size
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File size exceeds ${sizeMB}MB limit` };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'File extension not allowed' };
  }

  // Check for double extensions (potential bypass attempt)
  const doubleExtPattern = /\.(jpg|jpeg|png|gif|webp|svg|pdf|txt|csv|json)\.(exe|js|sh|bat|cmd|com|scr)$/i;
  if (doubleExtPattern.test(file.name)) {
    return { valid: false, error: 'Suspicious file name detected' };
  }

  return { valid: true };
};

/**
 * Browser storage utilities (not encrypted, but with JSON handling)
 */
export const browserStorage = {
  set: (key: string, value: unknown, expiryMs?: number): boolean => {
    try {
      const data = {
        value,
        expiry: expiryMs ? Date.now() + expiryMs : null,
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },

  get: <T = unknown>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const data = JSON.parse(item);
      
      // Check expiry
      if (data.expiry && Date.now() > data.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return data.value as T;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  },
};

/**
 * Session storage wrapper with same interface
 */
export const sessionStorage = {
  set: (key: string, value: unknown): boolean => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Session storage error:', error);
      return false;
    }
  },

  get: <T = unknown>(key: string): T | null => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) as T : null;
    } catch (error) {
      console.error('Session storage error:', error);
      return null;
    }
  },

  remove: (key: string): void => {
    window.sessionStorage.removeItem(key);
  },

  clear: (): void => {
    window.sessionStorage.clear();
  },
};

/**
 * CSRF Token management
 */
export const csrf = {
  generate: async (): Promise<string> => {
    return generateSecureToken(32);
  },

  store: (token: string): void => {
    sessionStorage.set('csrf_token', token);
  },

  get: (): string | null => {
    return sessionStorage.get<string>('csrf_token');
  },

  validate: (token: string): boolean => {
    const stored = csrf.get();
    return !!stored && stored === token;
  },
};

/**
 * Trusted types policy creation (for browsers that support it)
 */
export const createTrustedTypesPolicy = () => {
  if (typeof window !== 'undefined' && 'trustedTypes' in window) {
    try {
      return (window as typeof window & { trustedTypes: { createPolicy: (name: string, policy: unknown) => unknown } }).trustedTypes.createPolicy('default', {
        createHTML: (input: string) => sanitizeHTML(input),
        createScriptURL: (input: string) => {
          const url = sanitizeUrl(input);
          if (!url) throw new Error('Invalid URL');
          return url;
        },
      });
    } catch (error) {
      console.warn('Trusted Types not available:', error);
    }
  }
  return null;
};

/**
 * Check if running in secure context (HTTPS)
 */
export const isSecureContext = (): boolean => {
  return typeof window !== 'undefined' && window.isSecureContext;
};

/**
 * Detect potential XSS in user input (for logging/monitoring)
 */
export const detectPotentialXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<embed/i,
    /<object/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Format and validate phone numbers
 */
export const validatePhoneNumber = (phone: string, countryCode: string = 'US'): boolean => {
  // Basic international phone validation
  const patterns: Record<string, RegExp> = {
    US: /^(\+1)?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    UK: /^(\+44)?[-.\s]?(\(0\))?[-.\s]?(7\d{3}|\d{2,4})[-.\s]?\d{3,4}[-.\s]?\d{3,4}$/,
    // Add more country patterns as needed
  };

  const pattern = Object.prototype.hasOwnProperty.call(patterns, countryCode) ? patterns[countryCode as keyof typeof patterns] : /^[\d\s()+-]+$/;
  return pattern.test(phone.replace(/\s/g, ''));
};

/**
 * Sanitize JSON string to prevent injection
 */
export const sanitizeJSON = (jsonString: string): string | null => {
  try {
    const parsed = JSON.parse(jsonString);
    // Re-stringify to remove any potential code
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
};

/**
 * Time-safe string comparison to prevent timing attacks
 */
export const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};