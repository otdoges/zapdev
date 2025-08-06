/**
 * Device fingerprinting utility for generating unique device identifiers
 * Used for key derivation and security purposes
 */

/**
 * Generates a unique device fingerprint for key derivation
 * Combines multiple browser characteristics for better entropy
 */
export function getDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Canvas fingerprinting for additional entropy
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('🔐📱💻', 0, 0);
  }
  
  const factors = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') || '',
    screen.width.toString(),
    screen.height.toString(),
    screen.pixelDepth?.toString() || '',
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || '',
    canvas.toDataURL()
  ];
  
  return factors.join('|');
}