/**
 * Message encryption service for end-to-end encrypted chat messages
 * Extends the secure-storage encryption utilities for message content
 * 
 * Security features:
 * - AES-GCM encryption with device fingerprinting
 * - Integrity verification via checksums
 * - Key derivation from user ID + device fingerprint
 * - Secure storage integration
 */

import { getDeviceFingerprint } from './device-fingerprint';

// Configuration constants
const MESSAGE_ITERATIONS = 100000;
const MESSAGE_KEY_LENGTH = 256;

/**
 * Generates a checksum for integrity verification
 */
async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface EncryptedMessage {
  encryptedContent: string;
  salt: string;
  iv: string;
  checksum: string;
  timestamp: number;
}

export interface MessageDecryptionResult {
  content: string;
  isValid: boolean;
}


/**
 * Derives a cryptographic key from user ID and device fingerprint
 */
async function deriveMessageKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const deviceFingerprint = getDeviceFingerprint();
  
  // Combine user ID with device fingerprint for unique key per user per device
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`${userId}:${deviceFingerprint}`),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: MESSAGE_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: MESSAGE_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Validates message content before encryption
 */
function validateMessageContent(content: string): { isValid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Content must be a non-empty string' };
  }
  
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);
  if (contentBytes.length > 100000) { // 100KB limit for encrypted messages
    return { isValid: false, error: 'Message content too large for encryption (max 100KB)' };
  }
  
  return { isValid: true };
}

/**
 * Encrypts a message using AES-GCM with user-specific key derivation
 */
export async function encryptMessage(content: string, userId: string): Promise<EncryptedMessage> {
  try {
    // Validate input
    const validation = validateMessageContent(content);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required for message encryption');
    }
    
    // Generate cryptographic values
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive encryption key
    const key = await deriveMessageKey(userId, salt);
    
    // Encrypt the content
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encoder.encode(content)
    );
    
    // Generate checksum for integrity verification
    const checksum = await generateChecksum(content);
    
    return {
      encryptedContent: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
      checksum,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('Message encryption failed:', error);
    throw new Error('Failed to encrypt message content');
  }
}

/**
 * Decrypts a message using AES-GCM with user-specific key derivation
 */
export async function decryptMessage(encryptedMessage: EncryptedMessage, userId: string): Promise<MessageDecryptionResult> {
  try {
    // Validate inputs
    if (!encryptedMessage || typeof encryptedMessage !== 'object') {
      throw new Error('Invalid encrypted message data');
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required for message decryption');
    }
    
    const { encryptedContent, salt, iv, checksum } = encryptedMessage;
    
    if (!encryptedContent || !salt || !iv || !checksum) {
      throw new Error('Missing required encryption fields');
    }
    
    // Convert from base64
    const decoder = new TextDecoder();
    const encryptedBytes = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
    const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    // Derive decryption key
    const key = await deriveMessageKey(userId, saltBytes);
    
    // Decrypt the content
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes
      },
      key,
      encryptedBytes
    );
    
    const content = decoder.decode(decrypted);
    
    // Verify integrity
    const currentChecksum = await generateChecksum(content);
    const isValid = currentChecksum === checksum;
    
    if (!isValid) {
      console.warn('Message integrity check failed - content may be corrupted');
    }
    
    return {
      content,
      isValid
    };
    
  } catch (error) {
    const err = error as Error;
    if (err.name === 'OperationError') {
      console.warn('Message decryption failed (OperationError). Likely wrong device/user key or corrupted data.');
    } else {
      console.error('Message decryption failed:', error);
    }
    return {
      content: '[Decryption Failed]',
      isValid: false
    };
  }
}

/**
 * Checks if a message can be decrypted by the current user
 */
export async function canDecryptMessage(encryptedMessage: EncryptedMessage, userId: string): Promise<boolean> {
  try {
    const result = await decryptMessage(encryptedMessage, userId);
    return result.isValid;
  } catch {
    return false;
  }
}

/**
 * Message encryption utility class for easier usage
 */
export class MessageEncryption {
  private userId: string;
  
  constructor(userId: string) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required for MessageEncryption');
    }
    this.userId = userId;
  }
  
  async encrypt(content: string): Promise<EncryptedMessage> {
    return encryptMessage(content, this.userId);
  }
  
  async decrypt(encryptedMessage: EncryptedMessage): Promise<MessageDecryptionResult> {
    return decryptMessage(encryptedMessage, this.userId);
  }
  
  async canDecrypt(encryptedMessage: EncryptedMessage): Promise<boolean> {
    return canDecryptMessage(encryptedMessage, this.userId);
  }
  
  getUserId(): string {
    return this.userId;
  }
}

/**
 * Type guard to check if a message data object is encrypted
 */
export function isEncryptedMessage(messageData: unknown): messageData is {
  encryptedContent: string;
  salt: string;
  iv: string;
  checksum: string;
} {
  return !!(
    messageData &&
    typeof messageData === 'object' &&
    messageData !== null &&
    'encryptedContent' in messageData &&
    typeof (messageData as Record<string, unknown>).encryptedContent === 'string' &&
    'salt' in messageData &&
    typeof (messageData as Record<string, unknown>).salt === 'string' &&
    'iv' in messageData &&
    typeof (messageData as Record<string, unknown>).iv === 'string' &&
    'checksum' in messageData &&
    typeof (messageData as Record<string, unknown>).checksum === 'string'
  );
}

/**
 * Security health check for message encryption
 */
export async function getMessageEncryptionStatus(userId: string): Promise<{
  canEncrypt: boolean;
  canDecrypt: boolean;
  deviceSupported: boolean;
  error?: string;
}> {
  try {
    // Check if crypto API is available
    if (!crypto || !crypto.subtle) {
      return {
        canEncrypt: false,
        canDecrypt: false,
        deviceSupported: false,
        error: 'Web Crypto API not supported'
      };
    }
    
    // Test encryption/decryption with sample data
    const testMessage = 'Test encryption';
    const encrypted = await encryptMessage(testMessage, userId);
    const decrypted = await decryptMessage(encrypted, userId);
    
    return {
      canEncrypt: true,
      canDecrypt: decrypted.isValid && decrypted.content === testMessage,
      deviceSupported: true
    };
    
  } catch (error) {
    return {
      canEncrypt: false,
      canDecrypt: false,
      deviceSupported: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}