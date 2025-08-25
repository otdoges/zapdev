import { useEffect } from 'react';

interface Resource {
  href: string;
  as: string;
  type?: string;
  crossorigin?: string;
}

const CRITICAL_RESOURCES: Resource[] = [
  // Critical CSS
const CRITICAL_RESOURCES: Resource[] = [
  // Font stylesheet (safe cross-origin hint; actual font files are fetched by the stylesheet)
  { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', as: 'style' },
];

const DNS_PREFETCH_DOMAINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://api.groq.com',
  'https://api.clerk.dev',
];

export const ResourcePreloader: React.FC = () => {
  useEffect(() => {
    // DNS prefetch for external domains
    DNS_PREFETCH_DOMAINS.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Preload critical resources
    CRITICAL_RESOURCES.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
      document.head.appendChild(link);
    });

    // Preconnect to known third-party origins
    const preconnectDomains = [
      'https://fonts.gstatic.com',
      'https://api.groq.com',
      'https://api.clerk.dev',
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });


    // Service Worker registration with performance optimizations
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-custom.js', {
        scope: '/',
        updateViaCache: 'none'
      }).catch(() => {
        // Silently fail - SW is optional for performance
      });
    }
  }, []);

  return null;
};

export default ResourcePreloader;