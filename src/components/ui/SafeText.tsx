import React from 'react';
import DOMPurify from 'dompurify';

interface SafeTextProps {
  children: string;
  className?: string;
}

/**
 * SafeText component for XSS protection
 * Uses DOMPurify for comprehensive sanitization
 */
export const SafeText: React.FC<SafeTextProps> = ({ children, className = '' }) => {
  // Sanitize content using DOMPurify for comprehensive XSS protection
  const sanitizeContent = (text: string): string => {
    if (!text) return '';
    
    // Configure DOMPurify for text-only output
    const cleanText = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [], // No HTML tags allowed - text only
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true, // Keep text content even when removing tags
      RETURN_DOM: false, // Return string, not DOM
      RETURN_DOM_FRAGMENT: false
    });
    
    return cleanText.trim();
  };

  const safeContent = sanitizeContent(children);

  return (
    <span className={className}>
      {safeContent}
    </span>
  );
}; 

// Utility for sanitizing strings outside of React rendering
export function sanitizeText(input: string): string {
  if (!input) return '';
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
  return clean.replace(/\s+/g, ' ').trim();
}