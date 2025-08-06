// Secure storage utilities for sensitive data like API keys
// This provides basic obfuscation - for production use, consider proper encryption

// Simple XOR cipher for basic obfuscation (not cryptographically secure)
function obfuscate(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
}

function deobfuscate(obfuscated: string, key: string): string {
  try {
    const decoded = atob(obfuscated); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
}

// Generate a browser-specific key based on user agent and other factors
function getBrowserKey(): string {
  const factors = [
    navigator.userAgent.slice(0, 20),
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString()
  ];
  return factors.join('|').slice(0, 32);
}

const STORAGE_KEY = 'zapdev-secure-config';
const BROWSER_KEY = getBrowserKey();

export interface SecureConfig {
  useUserApiKey?: boolean;
  groqApiKey?: string;
  lastUpdated?: number;
}

// Store API key securely (with basic obfuscation)
export function setSecureApiKey(apiKey: string): void {
  try {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key');
    }

    // Basic validation - Groq API keys typically start with 'gsk_'
    if (!apiKey.startsWith('gsk_') && process.env.NODE_ENV === 'development') {
      console.warn('API key format may be invalid - expected to start with "gsk_"');
    }

    const config: SecureConfig = {
      useUserApiKey: true,
      groqApiKey: obfuscate(apiKey, BROWSER_KEY),
      lastUpdated: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error storing API key securely:', error);
    throw new Error('Failed to store API key');
  }
}

// Retrieve API key securely
export function getSecureApiKey(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const config: SecureConfig = JSON.parse(stored);
    
    // Check if config is too old (expire after 30 days for security)
    if (config.lastUpdated && Date.now() - config.lastUpdated > 30 * 24 * 60 * 60 * 1000) {
      clearSecureApiKey();
      return null;
    }

    if (config.useUserApiKey && config.groqApiKey) {
      const apiKey = deobfuscate(config.groqApiKey, BROWSER_KEY);
      
      // Basic validation
      if (!apiKey || apiKey.length < 10) {
        clearSecureApiKey();
        return null;
      }

      return apiKey;
    }

    return null;
  } catch (error) {
    // If there's any error reading/decrypting, clear the stored data
    clearSecureApiKey();
    return null;
  }
}

// Clear stored API key
export function clearSecureApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing API key:', error);
  }
}

// Check if user has provided their own API key
export function hasUserApiKey(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const config: SecureConfig = JSON.parse(stored);
    return config.useUserApiKey === true && !!config.groqApiKey;
  } catch {
    return false;
  }
}

// Get API key source (for logging/debugging - but never the actual key)
export function getApiKeySource(): 'user' | 'environment' | 'none' {
  if (hasUserApiKey()) return 'user';
  if (process.env.VITE_GROQ_API_KEY) return 'environment';
  return 'none';
}