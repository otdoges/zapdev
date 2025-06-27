import { describe, it, expect } from 'vitest';
import { validators, formSchemas, formatValidationErrors } from '@/lib/form-validation';
import { z } from 'zod';

describe('Form Validation', () => {
  describe('validators', () => {
    it('should validate email addresses correctly', () => {
      expect(() => validators.email.parse('test@example.com')).not.toThrow();
      expect(() => validators.email.parse('invalid-email')).toThrow();
      expect(() => validators.email.parse('')).toThrow();
    });

    it('should validate passwords correctly', () => {
      expect(() => validators.password.parse('ValidPass123')).not.toThrow();
      expect(() => validators.password.parse('weak')).toThrow();
      expect(() => validators.password.parse('nouppercaseordigits')).toThrow();
      expect(() => validators.password.parse('NOLOWERCASEORDIGITS')).toThrow();
      expect(() => validators.password.parse('NoDigits')).toThrow();
    });

    it('should validate usernames correctly', () => {
      expect(() => validators.username.parse('validuser123')).not.toThrow();
      expect(() => validators.username.parse('user_name')).not.toThrow();
      expect(() => validators.username.parse('us')).toThrow(); // Too short
      expect(() => validators.username.parse('user-with-invalid-chars!')).toThrow();
    });

    it('should validate URLs correctly', () => {
      expect(() => validators.url.parse('https://example.com')).not.toThrow();
      expect(() => validators.url.parse('')).not.toThrow(); // Empty is allowed
      expect(() => validators.url.parse('not-a-url')).toThrow();
    });
  });

  describe('formSchemas', () => {
    it('should validate sign-in form correctly', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(() => formSchemas.signIn.parse(validData)).not.toThrow();

      const invalidData = {
        email: 'invalid-email',
        password: '',
      };
      expect(() => formSchemas.signIn.parse(invalidData)).toThrow();
    });

    it('should validate sign-up form correctly', () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
      };
      expect(() => formSchemas.signUp.parse(validData)).not.toThrow();

      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'ValidPass123',
        confirmPassword: 'DifferentPass456',
      };
      expect(() => formSchemas.signUp.parse(invalidData)).toThrow();
    });
  });

  describe('formatValidationErrors', () => {
    it('should format Zod errors correctly', () => {
      try {
        formSchemas.signIn.parse({
          email: 'invalid-email',
          password: '',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatValidationErrors(error);
          expect(formatted).toHaveProperty('email');
          expect(formatted).toHaveProperty('password');
          expect(typeof formatted.email).toBe('string');
          expect(typeof formatted.password).toBe('string');
        }
      }
    });
  });
}); 