'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export function AnalyticsScripts() {
  useEffect(() => {
    // Initialize Plausible tracking function safely on client side
    if (typeof window !== 'undefined') {
      window.plausible = window.plausible || function() { 
        (window.plausible.q = window.plausible.q || []).push(arguments) 
      };
    }
  }, []);

  return (
    <>
      <Script
        defer
        data-domain="zapdev-mu.vercel.app"
        src="https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
        strategy="afterInteractive"
      />
      <Script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id="ad8b9534-5d4b-4039-a361-c71d2a6accee"
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