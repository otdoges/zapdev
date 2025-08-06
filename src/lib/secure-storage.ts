/**
 * Secure storage utilities for sensitive data like API keys
 * Uses Web Crypto API for proper encryption (AES-GCM)
 * 
 * Security notes:
 * - For production, consider using a backend proxy instead of client-side storage
 * - This provides reasonable security for client-side storage but is not foolproof
 * - API keys in browsers are inherently exposed to determined attackers
 */

import { getDeviceFingerprint } from './device-fingerprint';

// Configuration
const STORAGE_KEY = 'zapdev-secure-config';
const SALT_KEY = 'zapdev-salt';
const IV_KEY = 'zapdev-iv';
const ITERATIONS = 100000;
const KEY_EXPIRY_DAYS = 30;

export interface SecureConfig {
  useUserApiKey?: boolean;
  encryptedApiKey?: string;
  salt?: string;
  iv?: string;
  lastUpdated?: number;
  checksum?: string;
}

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}


/**
 * Generates a checksum for integrity verification
 */
async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypts text using AES-GCM
 */
async function encrypt(text: string, password: string): Promise<{ encrypted: string; salt: string; iv: string }> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(text)
  );
  
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv))
  };
}

/**
 * Decrypts text using AES-GCM
 */
async function decrypt(encryptedData: string, salt: string, iv: string, password: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    
    // Convert from base64
    const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    const key = await deriveKey(password, saltBytes);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes
      },
      key,
      encryptedBytes
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - invalid password or corrupted data');
  }
}

/**
 * Validates API key format
 */
function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Basic length check
  if (apiKey.length < 10 || apiKey.length > 200) {
    return false;
  }
  
  // Check for common patterns (adjust based on your API key format)
  // Groq keys typically start with 'gsk_'
  if (!apiKey.startsWith('gsk_') && !apiKey.startsWith('sk-')) {
    console.warn('API key format may be invalid');
  }
  
  // Check for suspicious patterns
  if (apiKey.includes('<script>') || apiKey.includes('javascript:')) {
    return false;
  }
  
  return true;
}

/**
 * Store API key securely with encryption
 */
export async function setSecureApiKey(apiKey: string): Promise<void> {
  try {
    // Validate input
    if (!validateApiKey(apiKey)) {
      throw new Error('Invalid API key format');
    }
    
    // Generate device-specific password
    const deviceFingerprint = getDeviceFingerprint();
    
    // Encrypt the API key
    const { encrypted, salt, iv } = await encrypt(apiKey, deviceFingerprint);
    
    // Generate checksum for integrity verification
    const checksum = await generateChecksum(apiKey);
    
    // Store encrypted data
    const config: SecureConfig = {
      useUserApiKey: true,
      encryptedApiKey: encrypted,
      salt,
      iv,
      lastUpdated: Date.now(),
      checksum
    };
    
    // Use sessionStorage for better security (clears on tab close)
    // Or use localStorage if you need persistence
    const storage = window.sessionStorage; // or window.localStorage
    storage.setItem(STORAGE_KEY, JSON.stringify(config));
    
  } catch (error) {
    console.error('Error storing API key:', error);
    throw new Error('Failed to store API key securely');
  }
}

/**
 * Retrieve and decrypt API key
 */
export async function getSecureApiKey(): Promise<string | null> {
  try {
    // Try sessionStorage first, then localStorage
    let stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = window.localStorage.getItem(STORAGE_KEY);
    }
    
    if (!stored) return null;
    
    const config: SecureConfig = JSON.parse(stored);
    
    // Check expiry
    if (config.lastUpdated && Date.now() - config.lastUpdated > KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
      await clearSecureApiKey();
      return null;
    }
    
    // Verify required fields
    if (!config.useUserApiKey || !config.encryptedApiKey || !config.salt || !config.iv) {
      return null;
    }
    
    // Decrypt the API key
    const deviceFingerprint = getDeviceFingerprint();
    const apiKey = await decrypt(
      config.encryptedApiKey,
      config.salt,
      config.iv,
      deviceFingerprint
    );
    
    // Verify integrity if checksum exists
    if (config.checksum) {
      const currentChecksum = await generateChecksum(apiKey);
      if (currentChecksum !== config.checksum) {
        console.error('API key integrity check failed');
        await clearSecureApiKey();
        return null;
      }
    }
    
    // Final validation
    if (!validateApiKey(apiKey)) {
      await clearSecureApiKey();
      return null;
    }
    
    return apiKey;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    await clearSecureApiKey();
    return null;
  }
}

/**
 * Clear stored API key from all storage locations
 */
export async function clearSecureApiKey(): Promise<void> {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    
    // Clear any related data
    window.sessionStorage.removeItem(SALT_KEY);
    window.sessionStorage.removeItem(IV_KEY);
    window.localStorage.removeItem(SALT_KEY);
    window.localStorage.removeItem(IV_KEY);
  } catch (error) {
    console.error('Error clearing API key:', error);
  }
}

/**
 * Check if user has provided their own API key
 */
export async function hasUserApiKey(): Promise<boolean> {
  try {
    let stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = window.localStorage.getItem(STORAGE_KEY);
    }
    
    if (!stored) return false;
    
    const config: SecureConfig = JSON.parse(stored);
    
    // Check if not expired
    if (config.lastUpdated && Date.now() - config.lastUpdated > KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
      return false;
    }
    
    return config.useUserApiKey === true && !!config.encryptedApiKey;
  } catch {
    return false;
  }
}

/**
 * Get API key source for debugging (never exposes the actual key)
 */
export function getApiKeySource(): 'user' | 'environment' | 'none' {
  // Check sessionStorage and localStorage
  const hasStored = window.sessionStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(STORAGE_KEY);
  
  if (hasStored) {
    try {
      const config: SecureConfig = JSON.parse(hasStored);
      if (config.useUserApiKey && config.encryptedApiKey) {
        return 'user';
      }
    } catch {
      // Invalid stored data
    }
  }
  
  // Check for environment variable
  if (import.meta.env?.VITE_GROQ_API_KEY) {
    return 'environment';
  }
  
  return 'none';
}

/**
 * Migrate from old obfuscated storage to new encrypted storage
 * (Optional: include this if you need to migrate existing data)
 */
export async function migrateFromOldStorage(oldApiKey: string): Promise<boolean> {
  try {
    if (!validateApiKey(oldApiKey)) {
      return false;
    }
    
    await setSecureApiKey(oldApiKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Security health check
 * Returns information about the current security status
 */
export async function getSecurityStatus(): Promise<{
  hasStoredKey: boolean;
  isExpired: boolean;
  storageType: 'session' | 'local' | 'none';
  daysUntilExpiry: number | null;
  isSecure: boolean;
}> {
  try {
    let stored = window.sessionStorage.getItem(STORAGE_KEY);
    let storageType: 'session' | 'local' | 'none' = 'none';
    
    if (stored) {
      storageType = 'session';
    } else {
      stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        storageType = 'local';
      }
    }
    
    if (!stored) {
      return {
        hasStoredKey: false,
        isExpired: false,
        storageType: 'none',
        daysUntilExpiry: null,
        isSecure: true
      };
    }
    
    const config: SecureConfig = JSON.parse(stored);
    const now = Date.now();
    const expiryTime = config.lastUpdated ? config.lastUpdated + (KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000) : 0;
    const isExpired = now > expiryTime;
    const daysUntilExpiry = config.lastUpdated 
      ? Math.max(0, Math.floor((expiryTime - now) / (24 * 60 * 60 * 1000)))
      : null;
    
    return {
      hasStoredKey: !!config.encryptedApiKey,
      isExpired,
      storageType,
      daysUntilExpiry,
      isSecure: storageType === 'session' && !isExpired
    };
  } catch {
    return {
      hasStoredKey: false,
      isExpired: false,
      storageType: 'none',
      daysUntilExpiry: null,
      isSecure: false
    };
  }
}