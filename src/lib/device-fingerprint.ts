/**
 * Device fingerprinting utility for generating unique device identifiers
 * Used for key derivation and security purposes
 */

/**
 * Deterministic FNV-1a 64-bit hash → hex string
 */
function fnv1a64Hex(input: string): string {
  // 64-bit prime and offset basis split into two 32-bit parts
  let h1 = 0xcbf29ce6; // high
  let h2 = 0x84222325; // low
  const prime1 = 0x000001b3;
  const prime2 = 0x10000000; // 2^28 used for mul hi overflow handling

  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    // XOR low with byte
    h2 ^= c & 0xff;

    // 64-bit multiply by FNV prime (0x000001b3)
    const low = (h2 & 0xffff) * prime1 + (((h2 >>> 16) * prime1) & 0xffff) * 0x10000;
    const carry = (low / 0x100000000) | 0;
    const high = (h1 * prime1 + carry) >>> 0;
    h1 = (high + ((h2 >>> 0) * prime2)) >>> 0; // incorporate hi overflow approximation
    h2 = low >>> 0;
  }

  const toHex = (n: number) => n.toString(16).padStart(8, '0');
  return toHex(h1) + toHex(h2);
}

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
        // Hash full data for stable entropy
        canvasData = fnv1a64Hex(canvas.toDataURL());
      } catch {
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

    // Stable hash of the factors
    const raw = factors.join('|');
    return fnv1a64Hex(raw);
    
  } catch {
    // Return a stable fallback fingerprint with safe navigator access (no timestamp)
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'unknown';
    const tz = new Date().getTimezoneOffset();
    return fnv1a64Hex(`fallback|${ua}|${lang}|${tz}`);
  }
}