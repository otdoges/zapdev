/**
 * Comprehensive tests for security utilities
 * Testing XSS protection, input validation, and rate limiting
 */

import { 
  sanitizeText, 
  validateInput, 
  validateChatTitle, 
  RateLimiter,
  MAX_MESSAGE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_TITLE_LENGTH
} from '../security';

describe('Security Utilities', () => {
  describe('sanitizeText', () => {
    it('should sanitize basic XSS patterns', () => {
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(sanitizeText('<img src="x" onerror="alert(1)">')).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
      expect(sanitizeText("javascript:alert('xss')")).toBe("javascript:alert(&#x27;xss&#x27;)");
    });

    it('should handle ampersands correctly', () => {
      expect(sanitizeText('Ben & Jerry')).toBe('Ben &amp; Jerry');
      expect(sanitizeText('A & B & C')).toBe('A &amp; B &amp; C');
    });

    it('should preserve safe text', () => {
      expect(sanitizeText('Hello world!')).toBe('Hello world!');
      expect(sanitizeText('This is a normal message.')).toBe('This is a normal message.');
      expect(sanitizeText('123456789')).toBe('123456789');
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
      expect(sanitizeText('\n\ttab and newline\n\t')).toBe('tab and newline');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText('   ')).toBe('');
    });

    it('should handle mixed content', () => {
      const mixed = 'Hello <b>world</b> & "friends"!';
      const expected = 'Hello &lt;b&gt;world&lt;/b&gt; &amp; &quot;friends&quot;!';
      expect(sanitizeText(mixed)).toBe(expected);
    });
  });

  describe('validateInput', () => {
    it('should validate normal input', () => {
      const result = validateInput('Hello world', 100);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-string input', () => {
      const result = validateInput(null as unknown as string, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input must be a non-empty string');
    });

    it('should reject empty strings', () => {
      const result = validateInput('', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input cannot be empty or only whitespace');
    });

    it('should reject whitespace-only strings', () => {
      const result = validateInput('   \n\t   ', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input cannot be empty or only whitespace');
    });

    it('should reject input exceeding max length', () => {
      const longText = 'a'.repeat(101);
      const result = validateInput(longText, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input exceeds maximum length of 100 characters');
    });

    it('should accept input at max length boundary', () => {
      const maxText = 'a'.repeat(100);
      const result = validateInput(maxText, 100);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateChatTitle', () => {
    it('should validate normal titles', () => {
      const result = validateChatTitle('My Chat Title');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-string titles', () => {
      const result = validateChatTitle(undefined as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title must be a non-empty string');
    });

    it('should reject empty titles', () => {
      const result = validateChatTitle('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`Title must be at least ${MIN_TITLE_LENGTH} character(s)`);
    });

    it('should reject titles that are too long', () => {
      const longTitle = 'a'.repeat(MAX_TITLE_LENGTH + 1);
      const result = validateChatTitle(longTitle);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`Title exceeds maximum length of ${MAX_TITLE_LENGTH} characters`);
    });

    it('should detect XSS patterns in titles', () => {
      const xssTests = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<iframe src="evil.com"></iframe>',
        'onclick="alert(1)"',
        '<object data="evil.swf"></object>',
        '<embed src="evil.swf">'
      ];

      xssTests.forEach(xssTitle => {
        const result = validateChatTitle(xssTitle);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Title contains potentially unsafe content');
      });
    });

    it('should allow safe HTML-like text', () => {
      // These look like HTML but aren't actually dangerous
      const safeTests = [
        'My Project v2.0',
        'API < Database Integration',
        'Component A > Component B',
        'Settings & Configuration'
      ];

      safeTests.forEach(safeTitle => {
        const result = validateChatTitle(safeTitle);
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle title trimming', () => {
      const result = validateChatTitle('  My Title  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(3, 1000); // 3 attempts per second
    });

    it('should allow requests within limit', () => {
      expect(rateLimiter.canMakeRequest('user1')).toBe(true);
      expect(rateLimiter.canMakeRequest('user1')).toBe(true);
      expect(rateLimiter.canMakeRequest('user1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      // Use up the limit
      rateLimiter.canMakeRequest('user1');
      rateLimiter.canMakeRequest('user1');
      rateLimiter.canMakeRequest('user1');
      
      // This should be blocked
      expect(rateLimiter.canMakeRequest('user1')).toBe(false);
    });

    it('should track different users separately', () => {
      // Use up limit for user1
      rateLimiter.canMakeRequest('user1');
      rateLimiter.canMakeRequest('user1');
      rateLimiter.canMakeRequest('user1');
      
      // user2 should still be able to make requests
      expect(rateLimiter.canMakeRequest('user2')).toBe(true);
      expect(rateLimiter.canMakeRequest('user2')).toBe(true);
    });

    it('should calculate remaining attempts correctly', () => {
      expect(rateLimiter.getRemainingAttempts('user1')).toBe(3);
      
      rateLimiter.canMakeRequest('user1');
      expect(rateLimiter.getRemainingAttempts('user1')).toBe(2);
      
      rateLimiter.canMakeRequest('user1');
      expect(rateLimiter.getRemainingAttempts('user1')).toBe(1);
      
      rateLimiter.canMakeRequest('user1');
      expect(rateLimiter.getRemainingAttempts('user1')).toBe(0);
    });

    it('should reset user limits', () => {
      // Use up the limit
      rateLimiter.canMakeRequest('user1');
      rateLimiter.canMakeRequest('user1');
      rateLimiter.canMakeRequest('user1');
      
      expect(rateLimiter.canMakeRequest('user1')).toBe(false);
      
      // Reset and try again
      rateLimiter.reset('user1');
      expect(rateLimiter.canMakeRequest('user1')).toBe(true);
    });

    it('should handle time-based resets', (done) => {
      const shortLimiter = new RateLimiter(2, 100); // 2 attempts per 100ms
      
      // Use up the limit
      shortLimiter.canMakeRequest('user1');
      shortLimiter.canMakeRequest('user1');
      expect(shortLimiter.canMakeRequest('user1')).toBe(false);
      
      // Wait for the time window to pass
      setTimeout(() => {
        expect(shortLimiter.canMakeRequest('user1')).toBe(true);
        done();
      }, 150);
    });
  });

  describe('Constants', () => {
    it('should have sensible security constants', () => {
      expect(MAX_MESSAGE_LENGTH).toBeGreaterThan(0);
      expect(MAX_MESSAGE_LENGTH).toBeLessThan(100000); // Reasonable upper bound
      
      expect(MAX_TITLE_LENGTH).toBeGreaterThan(0);
      expect(MAX_TITLE_LENGTH).toBeLessThan(1000);
      
      expect(MIN_TITLE_LENGTH).toBeGreaterThan(0);
      expect(MIN_TITLE_LENGTH).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    });
  });
});