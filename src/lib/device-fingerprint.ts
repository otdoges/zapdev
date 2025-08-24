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
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      typeof navigator === 'undefined'
    ) {
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
        ctx.fillText('Device fingerprint', 2, 2);
        canvasData = canvas.toDataURL().slice(0, 50); // Take first 50 chars for entropy
      } catch {
        // Avoid ReferenceError in browsers without a process shim
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.warn('Canvas fingerprinting failed, using fallback');
        }
        canvasData = 'canvas-blocked';
      }
    } else {
      canvasData = 'canvas-unavailable';
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

    // Create a hash-like string from the factors
    return factors.join('|').replace(/[^a-zA-Z0-9|]/g, '').slice(0, 100);
    
  } catch (error: unknown) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.error('Device fingerprinting failed completely, using fallback', error);
    }
    // Return a stable fallback fingerprint with safe navigator access (no timestamp)
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'unknown';
    const tz = new Date().getTimezoneOffset();
    return `fallback|${ua}|${lang}|${tz}`.replace(/[^a-zA-Z0-9|]/g, '').slice(0, 100);
  }
}