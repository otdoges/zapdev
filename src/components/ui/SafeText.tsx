import React from 'react';

interface SafeTextProps {
  children: string;
  className?: string;
}

/**
 * SafeText component for XSS protection
 * Sanitizes text input and prevents script injection
 */
export const SafeText: React.FC<SafeTextProps> = ({ children, className = '' }) => {
  // Sanitize the text content to prevent XSS
  const sanitizeText = (text: string): string => {
    return text
      .replace(/[<>'"&]/g, (char) => {
        const chars: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#x27;',
          '"': '&quot;',
          '&': '&amp;'
        };
        return chars[char] || char;
      })
      .trim();
  };

  // Additional security: Remove any remaining script-like patterns
  const removeScriptPatterns = (text: string): string => {
    return text
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=, onload=, etc.
  };

  const safeContent = removeScriptPatterns(sanitizeText(children || ''));

  return (
    <span className={className}>
      {safeContent}
    </span>
  );
}; 