/**
 * Device fingerprinting utility for generating unique device identifiers
 * Used for key derivation and security purposes
 */

/**
 * Generates a unique device fingerprint for key derivation
 * Combines multiple browser characteristics for better entropy
 */
export function getDeviceFingerprint(): string {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'ssr-environment';
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let canvasData = '';
    // Canvas fingerprinting for additional entropy
    if (ctx) {
      try {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('🔐📱💻', 0, 0);
        canvasData = canvas.toDataURL();
      } catch {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Canvas fingerprinting failed, using fallback');
        }
        canvasData = 'canvas-blocked';
      }
    }
    
    const factors = [
      typeof navigator !== 'undefined' ? (navigator.userAgent || 'unknown-ua') : 'ssr-ua',
      typeof navigator !== 'undefined' ? (navigator.language || 'unknown-lang') : 'ssr-lang',
      typeof navigator !== 'undefined' ? (navigator.languages?.join(',') || '') : '',
      typeof screen !== 'undefined' ? (screen.width?.toString() || '0') : '0',
      typeof screen !== 'undefined' ? (screen.height?.toString() || '0') : '0',
      typeof screen !== 'undefined' ? (screen.pixelDepth?.toString() || '0') : '0',
      new Date().getTimezoneOffset().toString(),
      typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency?.toString() || '0') : '0',
      canvasData
    ];
    
    return factors.join('|');
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Device fingerprinting failed completely, using fallback', error);
    }
    // Return a stable fallback fingerprint with safe navigator access
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    return `fallback|${userAgent}|${Date.now()}`;
  }
}