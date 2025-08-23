/**
 * Secure GitHub token storage utility
 * Uses the existing secure storage infrastructure for GitHub tokens specifically
 */

import { setSecureApiKey, getSecureApiKey, clearSecureApiKey } from './secure-storage';
import * as Sentry from '@sentry/react';

const { logger } = Sentry;

/**
 * Validates GitHub token format with enhanced security checks
 */
export function validateGitHubToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Remove whitespace
  token = token.trim();
  
  // Check for proper GitHub token formats
  const isClassicToken = token.startsWith('ghp_') && token.length === 40;
  const isFineGrainedToken = token.startsWith('github_pat_') && token.length >= 82;
  
  // Additional security checks
  if (token.includes('<script>') || token.includes('javascript:') || token.includes('data:')) {
    logger.warn('Potentially malicious token detected', { tokenPrefix: token.substring(0, 10) });
    return false;
  }
  
  return isClassicToken || isFineGrainedToken;
}

/**
 * Securely store GitHub token
 */
export async function setGitHubToken(token: string): Promise<void> {
  if (!validateGitHubToken(token)) {
    throw new Error('Invalid GitHub token format. Please use a valid GitHub Personal Access Token.');
  }
  
  try {
    // Use the existing secure storage for API keys
    // We'll prefix with 'github_' to distinguish from other API keys
    await setSecureApiKey(`github_${token.trim()}`);
    logger.info('GitHub token stored securely');
  } catch (error) {
    logger.error('Failed to store GitHub token:', error);
    throw new Error('Failed to securely store GitHub token');
  }
}

/**
 * Retrieve GitHub token securely
 */
export async function getGitHubToken(): Promise<string | null> {
  try {
    const storedKey = await getSecureApiKey();
    if (!storedKey) return null;
    
    // Check if it's a GitHub token (has our prefix)
    if (storedKey.startsWith('github_')) {
      const token = storedKey.substring(7); // Remove 'github_' prefix
      
      // Validate before returning
      if (validateGitHubToken(token)) {
        return token;
      } else {
        // Token is corrupted or invalid, clear it
        await clearGitHubToken();
        return null;
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to retrieve GitHub token:', error);
    return null;
  }
}

/**
 * Clear GitHub token from storage
 */
export async function clearGitHubToken(): Promise<void> {
  try {
    await clearSecureApiKey();
    logger.info('GitHub token cleared from storage');
  } catch (error) {
    logger.error('Failed to clear GitHub token:', error);
  }
}

/**
 * Check if user has configured a GitHub token
 */
export async function hasGitHubToken(): Promise<boolean> {
  try {
    const token = await getGitHubToken();
    return token !== null;
  } catch {
    return false;
  }
}

/**
 * Legacy migration: move tokens from localStorage to secure storage
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    const legacyToken = localStorage.getItem('github_access_token');
    if (legacyToken && validateGitHubToken(legacyToken)) {
      await setGitHubToken(legacyToken);
      localStorage.removeItem('github_access_token');
      logger.info('Successfully migrated GitHub token from localStorage to secure storage');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to migrate GitHub token:', error);
    return false;
  }
}