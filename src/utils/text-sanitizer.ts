/**
 * Text Sanitization Utility
 * 
 * Provides HTML escaping and text sanitization for user-provided content
 * to prevent XSS attacks when rendering in React components.
 */

import { z } from 'zod';
/**
 * HTML escape characters mapping
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

// Input security limits (tune per product requirements)
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_TITLE_LENGTH = 120;
export const MAX_CODE_BLOCK_LENGTH = 20000;

// Basic malicious pattern detection (defense-in-depth; escaping already neutralizes tags)
const MALICIOUS_PATTERNS: ReadonlyArray<RegExp> = [
  /<\s*script\b/i,
  /\bon\w+\s*=/i,      // onload=, onclick=, etc.
  /javascript:\s*/i,
];

export interface ValidationResult { isValid: boolean; error?: string }

export const safeTextSchema = z
  .string()
  .max(MAX_MESSAGE_LENGTH, `Text must be <= ${MAX_MESSAGE_LENGTH} characters`)
  .refine((s) => !MALICIOUS_PATTERNS.some((rx) => rx.test(s)), 'Potentially unsafe content detected');

export function validateInput(text: unknown): ValidationResult {
  if (typeof text !== 'string') return { isValid: false, error: 'Text must be a string' };
  const parsed = safeTextSchema.safeParse(text);
  return parsed.success ? { isValid: true } : { isValid: false, error: parsed.error.issues[0]?.message };
}


/**
 * Escapes HTML characters in a string to prevent XSS attacks
 * @param text - The text to escape
 * @returns HTML-escaped string
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'`=/]/g, (match) => {
    const escaped = Object.prototype.hasOwnProperty.call(HTML_ESCAPE_MAP, match) 
      ? HTML_ESCAPE_MAP[match as keyof typeof HTML_ESCAPE_MAP] 
      : match;
    return escaped;
  });
}

/**
 * Sanitizes text for safe display in React components
 * Handles null/undefined values with optional fallback
 * @param text - The text to sanitize (can be null/undefined)
 * @param fallback - Fallback text if input is null/undefined
 * @returns Sanitized text safe for display
 */
export function sanitizeText(text: string | null | undefined, fallback = ''): string {
  if (text == null) {
    return fallback;
  }
  
  if (typeof text !== 'string') {
    return escapeHtml(String(text));
  }
  
  return escapeHtml(text);
}

/**
 * Sanitizes code content specifically for code blocks
 * Preserves formatting while escaping HTML
 * @param code - The code content to sanitize
 * @param fallback - Fallback text if code is null/undefined
 * @returns Sanitized code safe for display
 */
export function sanitizeCode(code: string | null | undefined, fallback = '// No code to display'): string {
  return sanitizeText(code, fallback);
}

/**
 * Sanitizes execution output/error content
 * @param output - The output content to sanitize
 * @param fallback - Fallback text if output is null/undefined
 * @returns Sanitized output safe for display
 */
export function sanitizeOutput(output: string | null | undefined, fallback = 'No output'): string {
  return sanitizeText(output, fallback);
}

/**
 * Creates sanitized HTML string for use with dangerouslySetInnerHTML
 * Only use this when you need HTML rendering capabilities
 * @param text - The text to sanitize
 * @param fallback - Fallback text if input is null/undefined
 * @returns Object with __html property for dangerouslySetInnerHTML
 */
export function createSanitizedHtml(text: string | null | undefined, fallback = ''): { __html: string } {
  return { __html: sanitizeText(text, fallback) };
}

export function sanitizeAndValidateText(text: unknown, fallback = ''): { value: string; isValid: boolean; error?: string } {
  const result = validateInput(text);
  if (!result.isValid) return { value: fallback, isValid: false, error: result.error };
  return { value: sanitizeText(text, fallback), isValid: true };
}
