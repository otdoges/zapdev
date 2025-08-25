import { useEffect, useRef, useCallback } from 'react';

// Performance API type definitions
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  target?: EventTarget;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  lastInputTime: number;
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

interface PerformanceOptimizerProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enableLazyLoading?: boolean;
  enablePreloading?: boolean;
  enableImageOptimization?: boolean;
  enableResourceHints?: boolean;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  onMetricsUpdate,
  enableLazyLoading = true,
  enablePreloading = true,
  enableImageOptimization = true,
  enableResourceHints = true
}) => {
  const observerRef = useRef<PerformanceObserver | null>(null);
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0
  });

  // Measure Core Web Vitals
  const measureCoreWebVitals = useCallback(() => {
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      try {
        observerRef.current = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              metricsRef.current.fcp = entry.startTime;
              onMetricsUpdate?.(metricsRef.current);
            }
          }
        });
        observerRef.current.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('FCP measurement failed:', e);
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            metricsRef.current.lcp = lastEntry.startTime;
            onMetricsUpdate?.(metricsRef.current);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP measurement failed:', e);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const firstInputEntry = entry as PerformanceEventTiming;
            if (firstInputEntry.processingStart) {
              metricsRef.current.fid = firstInputEntry.processingStart - firstInputEntry.startTime;
              onMetricsUpdate?.(metricsRef.current);
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID measurement failed:', e);
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as LayoutShift;
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value;
            }
          }
          metricsRef.current.cls = clsValue;
          onMetricsUpdate?.(metricsRef.current);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS measurement failed:', e);
      }
    }

    // Time to First Byte
    if (performance.timing) {
      const navigationStart = performance.timing.navigationStart;
      const responseStart = performance.timing.responseStart;
      if (navigationStart && responseStart) {
        metricsRef.current.ttfb = responseStart - navigationStart;
        onMetricsUpdate?.(metricsRef.current);
      }
    }
  }, [onMetricsUpdate]);

  // Lazy load images
  const setupLazyLoading = useCallback(() => {
    if (!enableLazyLoading) return;

    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }, [enableLazyLoading]);

  // Preload critical resources
  const setupPreloading = useCallback(() => {
    if (!enablePreloading) return;

    // Preload critical CSS
    const criticalCSS = document.createElement('link');
    criticalCSS.rel = 'preload';
    criticalCSS.as = 'style';
    criticalCSS.href = '/src/index.css';
    document.head.appendChild(criticalCSS);

    // Preload critical fonts
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.as = 'font';
    fontPreload.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    fontPreload.crossOrigin = 'anonymous';
    document.head.appendChild(fontPreload);
  }, [enablePreloading]);

  // Optimize images
  const optimizeImages = useCallback(() => {
    if (!enableImageOptimization) return;

    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      // Add loading="lazy" for images below the fold
      if (!img.hasAttribute('loading')) {
        img.loading = 'lazy';
      }

      // Add decoding="async" for better performance
      if (!img.hasAttribute('decoding')) {
        img.decoding = 'async';
      }

      // Add fetchpriority="high" for above-the-fold images
      if (img.dataset.priority === 'high') {
        img.fetchPriority = 'high';
      }
    });
  }, [enableImageOptimization]);

  // Add resource hints
  const addResourceHints = useCallback(() => {
    if (!enableResourceHints) return;

    // DNS prefetch for external domains
    const domains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.gpteng.co',
      'https://api.openai.com',
      'https://api.anthropic.com'
    ];

    domains.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Preconnect to critical domains
    const criticalDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.gpteng.co'
    ];

    criticalDomains.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, [enableResourceHints]);

  // Optimize bundle loading
  const optimizeBundleLoading = useCallback(() => {
    // Add modulepreload for critical scripts
    const criticalScripts = [
      'https://cdn.gpteng.co/gptengineer.js'
    ];

    criticalScripts.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = src;
      if (src.startsWith('http')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }, []);

  // Monitor performance
  const monitorPerformance = useCallback(() => {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry);
              // Report to analytics if needed
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task monitoring failed:', e);
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as Performance & { memory: { usedJSHeapSize: number } }).memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          console.warn('High memory usage detected:', memory);
        }
      }, 10000);
    }
  }, []);

  useEffect(() => {
    // Initialize performance monitoring
    measureCoreWebVitals();
    setupLazyLoading();
    setupPreloading();
    optimizeImages();
    addResourceHints();
    optimizeBundleLoading();
    monitorPerformance();

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [
    measureCoreWebVitals,
    setupLazyLoading,
    setupPreloading,
    optimizeImages,
    addResourceHints,
    optimizeBundleLoading,
    monitorPerformance
  ]);

  // Expose metrics for external use
  useEffect(() => {
    (window as Window & { zapdevPerformanceMetrics?: PerformanceMetrics }).zapdevPerformanceMetrics = metricsRef.current;
  }, []);

  return null; // This component doesn't render anything
};

// Utility functions for performance optimization
export const performanceUtils = {
  // Debounce function calls
  debounce: <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function calls
  throttle: <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Preload image
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  // Preload script
  preloadScript: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  // Get current performance metrics
  getMetrics: (): PerformanceMetrics => {
    const windowWithMetrics = window as Window & { zapdevPerformanceMetrics?: PerformanceMetrics };
    return windowWithMetrics.zapdevPerformanceMetrics || {
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0
    };
  },

  // Check if metrics are good
  areMetricsGood: (metrics: PerformanceMetrics): boolean => {
    return (
      metrics.fcp < 1800 && // FCP < 1.8s
      metrics.lcp < 2500 && // LCP < 2.5s
      metrics.fid < 100 &&  // FID < 100ms
      metrics.cls < 0.1     // CLS < 0.1
    );
  }
};

export default PerformanceOptimizer;
