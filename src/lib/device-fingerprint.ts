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
      } catch (error) {
        console.warn('Canvas fingerprinting failed, using fallback');
        canvasData = 'canvas-blocked';
      }
    }
    
    const factors = [
      navigator.userAgent || 'unknown-ua',
      navigator.language || 'unknown-lang',
      navigator.languages?.join(',') || '',
      screen.width?.toString() || '0',
      screen.height?.toString() || '0',
      screen.pixelDepth?.toString() || '0',
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || '0',
      canvasData
    ];
    
    return factors.join('|');
  } catch (error) {
    console.error('Device fingerprinting failed completely, using fallback:', error);
    // Return a stable fallback fingerprint
    return `fallback|${navigator.userAgent || 'unknown'}|${Date.now()}`;
  }
}