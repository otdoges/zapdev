'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const COOKIE_CONSENT_KEY = 'zapdev-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'zapdev-cookie-preferences';

export function AnalyticsScripts() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if user has given consent and enabled analytics
    const checkAnalyticsConsent = () => {
      const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      
      if (hasConsent && savedPreferences) {
        try {
          const preferences = JSON.parse(savedPreferences);
          setAnalyticsEnabled(preferences.analytics === true);
        } catch (error) {
          console.error('Failed to parse cookie preferences:', error);
          setAnalyticsEnabled(false);
        }
      }
    };

    checkAnalyticsConsent();

    // Listen for cookie preference changes
    const handlePreferencesChange = (event: CustomEvent) => {
      const preferences = event.detail;
      setAnalyticsEnabled(preferences.analytics === true);
    };

    window.addEventListener('cookiePreferencesChanged', handlePreferencesChange as EventListener);

    return () => {
      window.removeEventListener('cookiePreferencesChanged', handlePreferencesChange as EventListener);
    };
  }, []);

  useEffect(() => {
    // Initialize Plausible tracking function safely on client side
    if (typeof window !== 'undefined' && analyticsEnabled) {
      window.plausible = window.plausible || function() { 
        (window.plausible.q = window.plausible.q || []).push(arguments) 
      };
    }
  }, [analyticsEnabled]);

  // Don't render anything until mounted and analytics is enabled
  if (!mounted || !analyticsEnabled) {
    return null;
  }

  return (
    <>
      <Script
        defer
        data-domain="zapdev.link"
        src="https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
        strategy="afterInteractive"
      />
      <Script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id="ad8b9534-5d4b-4039-a361-c71d2a6accee"
        strategy="afterInteractive"
      />
      <Script
        async
        src="https://cdn.databuddy.cc/databuddy.js"
        data-client-id="idyqxiu_d_-8iTANsiprw"
        data-enable-batching="true"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    </>
  );
}

// Type declaration for window.plausible
declare global {
  interface Window {
    plausible: any;
  }
} 