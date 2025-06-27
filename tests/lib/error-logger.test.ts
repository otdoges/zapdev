import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorLogger, ErrorCategory, ErrorLevel } from '@/lib/error-logger';

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {}),
};

describe('Error Logger', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('basic logging', () => {
    it('should log info messages', () => {
      errorLogger.info(ErrorCategory.GENERAL, 'Test info message');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('should log warning messages', () => {
      errorLogger.warning(ErrorCategory.API, 'Test warning message');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      );
    });

    it('should log error messages', () => {
      const testError = new Error('Test error');
      errorLogger.error(ErrorCategory.DATABASE, 'Test error message', testError);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('should log debug messages', () => {
      errorLogger.debug(ErrorCategory.AI_MODEL, 'Test debug message');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message')
      );
    });
  });

  describe('error categorization', () => {
    it('should handle different error categories', () => {
      const categories = [
        ErrorCategory.GENERAL,
        ErrorCategory.API,
        ErrorCategory.DATABASE,
        ErrorCategory.AUTH,
        ErrorCategory.AI_MODEL,
        ErrorCategory.WEBCONTAINER,
      ];

      categories.forEach(category => {
        errorLogger.info(category, `Test message for ${category}`);
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining(category)
        );
      });
    });
  });

  describe('context handling', () => {
    it('should include context in log entries', () => {
      const context = { userId: '123', action: 'test' };
      errorLogger.error(ErrorCategory.GENERAL, 'Test with context', new Error('test'), context);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test with context')
      );
    });

    it('should handle error objects with stack traces', () => {
      const error = new Error('Test error with stack');
      errorLogger.error(ErrorCategory.GENERAL, 'Error with stack', error);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Error with stack')
      );
    });
  });

  describe('environment handling', () => {
    it('should work in test environment', () => {
      expect(() => {
        errorLogger.info(ErrorCategory.GENERAL, 'Test environment check');
      }).not.toThrow();
    });
  });
}); 