import { useEffect } from 'react';

// Preload critical above-the-fold images to improve LCP
const CRITICAL_IMAGES = [
  '/placeholder.svg',
  '/og-image.svg',
  '/favicon.svg',
  // Add your hero/landing page images here
];

export const HeroImagePreloader: React.FC = () => {
  useEffect(() => {
    const preloadImages = () => {
      CRITICAL_IMAGES.forEach(src => {
        const img = new Image();
        img.src = src;
        
        // Add to link preload for better browser prioritization
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        link.fetchPriority = 'high';
        document.head.appendChild(link);
      });
    };

    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadImages);
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(preloadImages, 1);
    }
  }, []);

  return null;
};

export default HeroImagePreloader;