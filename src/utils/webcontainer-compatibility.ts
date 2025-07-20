import { BrowserCompatibilityResult } from "@/types/webcontainer";

/**
 * Check browser compatibility for WebContainer
 * @returns Object containing compatibility status and reason if not compatible
 */
export const checkBrowserCompatibility = (): BrowserCompatibilityResult => {
  if (typeof SharedArrayBuffer === 'undefined') {
    return { 
      compatible: false, 
      reason: 'SharedArrayBuffer is not available. This feature requires a secure context (HTTPS) and specific browser headers.' 
    };
  }
  
  if (typeof crossOriginIsolated === 'undefined' || !crossOriginIsolated) {
    return { 
      compatible: false, 
      reason: 'Cross-origin isolation is not enabled. Please ensure proper headers are set.' 
    };
  }
  
  // Check for Chrome/Chromium (best support)
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  
  if (!isChrome && !isSafari && !isFirefox) {
    return { 
      compatible: false, 
      reason: 'WebContainer requires Chrome, Safari 16.4+, or Firefox with experimental features enabled.' 
    };
  }
  
  return { compatible: true, reason: '' };
}; 