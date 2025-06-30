'use client';

import { useEffect } from 'react';

// Type declarations for browser APIs
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType: string;
    addEventListener: (event: string, handler: () => void) => void;
  };
}

export function PerformanceOptimizer() {
  useEffect(() => {
    // Detect device capabilities and apply optimizations
    const applyPerformanceOptimizations = () => {
      const html = document.documentElement;

      // Detect low-end devices
      const isLowEndDevice = () => {
        // Check for various performance indicators
        const hardwareConcurrency = navigator.hardwareConcurrency || 1;
        const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 1;
        const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
        
        // Consider it low-end if:
        // - Less than 4 CPU cores
        // - Less than 4GB RAM
        // - Slow connection
        const lowCPU = hardwareConcurrency < 4;
        const lowMemory = deviceMemory < 4;
        const slowConnection = connection && (
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          connection.effectiveType === '3g'
        );

        return lowCPU || lowMemory || slowConnection;
      };

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Apply optimizations based on device capabilities
      if (isLowEndDevice() || prefersReducedMotion) {
        html.classList.add('reduce-motion');
        
        // Disable heavy animations and effects
        const style = document.createElement('style');
        style.textContent = `
          .reduce-motion *,
          .reduce-motion *::before,
          .reduce-motion *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          
          .reduce-motion .glass-effect {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: rgba(255, 255, 255, 0.05) !important;
          }
          
          .reduce-motion .text-gradient,
          .reduce-motion .shimmer-effect {
            background: var(--deep-violet) !important;
            -webkit-background-clip: unset !important;
            -webkit-text-fill-color: unset !important;
            background-clip: unset !important;
            color: var(--deep-violet) !important;
          }
        `;
        document.head.appendChild(style);
        
        console.log('Performance optimizations applied for low-end device');
      }

      // Optimize scroll performance
      if ('CSS' in window && 'supports' in window.CSS) {
        if (!window.CSS.supports('scroll-behavior', 'smooth')) {
          html.style.scrollBehavior = 'auto';
        }
      }

      // Preload critical resources for better performance
      const preloadCriticalResources = () => {
        // Preload commonly used icons
        const iconPreloads = [
          '/favicon.svg',
          // Add other critical icons here
        ];

        iconPreloads.forEach(href => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = href;
          link.as = 'image';
          document.head.appendChild(link);
        });
      };

      // Optimize images with Intersection Observer
      const optimizeImages = () => {
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                  imageObserver.unobserve(img);
                }
              }
            });
          });

          // Observe all images with data-src attribute
          document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
          });
        }
      };

      // Set up performance monitoring
      const setupPerformanceMonitoring = () => {
        // Monitor Largest Contentful Paint
        if ('PerformanceObserver' in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                  console.log('LCP:', entry.startTime);
                  
                  // If LCP is too slow, apply additional optimizations
                  if (entry.startTime > 2500) {
                    html.classList.add('performance-mode');
                    
                    // Further reduce animations and effects
                    const performanceStyle = document.createElement('style');
                    performanceStyle.textContent = `
                      .performance-mode * {
                        transition: none !important;
                        animation: none !important;
                      }
                    `;
                    document.head.appendChild(performanceStyle);
                  }
                }
              }
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Disconnect after initial measurement
            setTimeout(() => observer.disconnect(), 10000);
          } catch {
            console.warn('Performance monitoring not available');
          }
        }
      };

      // Apply optimizations
      preloadCriticalResources();
      optimizeImages();
      setupPerformanceMonitoring();

      // Listen for connection changes
      if ('connection' in navigator) {
        const connection = (navigator as NavigatorWithConnection).connection;
        const updateConnectionStatus = () => {
          if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
            html.classList.add('slow-connection');
            
            // Disable heavy features on slow connections
            const slowConnectionStyle = document.createElement('style');
            slowConnectionStyle.textContent = `
              .slow-connection .glass-effect {
                backdrop-filter: none !important;
                background: rgba(255, 255, 255, 0.03) !important;
              }
              .slow-connection video {
                display: none !important;
              }
            `;
            document.head.appendChild(slowConnectionStyle);
          } else {
            html.classList.remove('slow-connection');
          }
        };

        connection?.addEventListener('change', updateConnectionStatus);
        updateConnectionStatus();
      }

      // Add error boundary for WebContainer failures
      window.addEventListener('error', (event) => {
        if (event.error?.message?.includes('WebContainer')) {
          console.warn('WebContainer error detected, enabling fallback mode');
          html.classList.add('webcontainer-fallback');
        }
      });

      // Add unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.message?.includes('WebContainer')) {
          console.warn('WebContainer promise rejection, enabling fallback mode');
          html.classList.add('webcontainer-fallback');
        }
      });
    };

    // Apply optimizations after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyPerformanceOptimizations);
    } else {
      applyPerformanceOptimizations();
    }

    // Cleanup function
    return () => {
      // Remove event listeners if needed
    };
  }, []);

  // This component doesn't render anything visible
  return null;
} 