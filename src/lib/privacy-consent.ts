/**
 * Privacy Consent Management
 * 
 * Manages user consent for data collection, particularly for PII (Personally Identifiable Information)
 * in error monitoring systems like Sentry.
 */

import { browserStorage } from './security';

export interface PrivacyConsent {
  errorMonitoring: boolean;
  analytics: boolean;
  performance: boolean;
  screenshots: boolean;
  timestamp: number;
  version: string;
}

const CONSENT_STORAGE_KEY = 'zapdev_privacy_consent';
const CURRENT_CONSENT_VERSION = '1.0';
const CONSENT_EXPIRY_DAYS = 365; // 1 year

/**
 * Privacy consent manager
 */
export const privacyConsent = {
  /**
   * Get current user consent state
   */
  getConsent(): PrivacyConsent | null {
    try {
      const stored = browserStorage.get<PrivacyConsent>(CONSENT_STORAGE_KEY);
      
      // Check if consent exists and is not expired
      if (stored && stored.version === CURRENT_CONSENT_VERSION) {
        const now = Date.now();
        const consentAge = now - stored.timestamp;
        const expiryMs = CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        
        if (consentAge < expiryMs) {
          return stored;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error reading privacy consent:', error);
      return null;
    }
  },

  /**
   * Set user consent preferences
   */
  setConsent(consent: Omit<PrivacyConsent, 'timestamp' | 'version'>): boolean {
    try {
      const consentData: PrivacyConsent = {
        ...consent,
        timestamp: Date.now(),
        version: CURRENT_CONSENT_VERSION,
      };

      const expiryMs = CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      return browserStorage.set(CONSENT_STORAGE_KEY, consentData, expiryMs);
    } catch (error) {
      console.error('Error storing privacy consent:', error);
      return false;
    }
  },

  /**
   * Clear all stored consent data
   */
  clearConsent(): void {
    try {
      browserStorage.remove(CONSENT_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing privacy consent:', error);
    }
  },

  /**
   * Check if user has given consent for error monitoring (PII collection)
   */
  hasErrorMonitoringConsent(): boolean {
    const consent = this.getConsent();
    return consent?.errorMonitoring === true;
  },

  /**
   * Check if user has given consent for analytics
   */
  hasAnalyticsConsent(): boolean {
    const consent = this.getConsent();
    return consent?.analytics === true;
  },

  /**
   * Check if user has given consent for performance monitoring
   */
  hasPerformanceConsent(): boolean {
    const consent = this.getConsent();
    return consent?.performance === true;
  },

  /**
   * Check if user has given consent for screenshot capture
   */
  hasScreenshotConsent(): boolean {
    const consent = this.getConsent();
    return consent?.screenshots === true;
  },

  /**
   * Check if consent is required (no consent given yet)
   */
  isConsentRequired(): boolean {
    return this.getConsent() === null;
  },
};

/**
 * Determine if screenshots should be enabled based on environment flag and user consent
 */
export function shouldEnableScreenshots(): boolean {
  // Environment flag must be explicitly set to 'true'
  const envFlag = import.meta.env.VITE_SENTRY_ENABLE_SCREENSHOTS === 'true';
  
  // User must have explicitly consented to screenshots
  const userConsent = privacyConsent.hasScreenshotConsent();
  
  // Both conditions must be true
  return envFlag && userConsent;
}

/**
 * Determine if PII should be sent to Sentry based on environment flag and user consent
 */
export function shouldSendPII(): boolean {
  // Environment flag must be explicitly set to 'true'
  const envFlag = import.meta.env.VITE_SENTRY_SEND_PII === 'true';
  
  // User must have explicitly consented to error monitoring
  const userConsent = privacyConsent.hasErrorMonitoringConsent();
  
  // Both conditions must be true
  return envFlag && userConsent;
}

/**
 * Get default privacy consent (all disabled for privacy-by-default)
 */
export function getDefaultConsent(): Omit<PrivacyConsent, 'timestamp' | 'version'> {
  return {
    errorMonitoring: false,
    analytics: false,
    performance: false,
    screenshots: false,
  };
}