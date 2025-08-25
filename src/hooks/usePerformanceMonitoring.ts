import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  navigationTiming?: PerformanceNavigationTiming;
  paintTiming?: PerformancePaintTiming[];
  resourceTiming?: PerformanceResourceTiming[];
  memoryInfo?: Performance & { memory?: { usedJSHeapSize: number } };
}

export const usePerformanceMonitoring = () => {
  const measureWebVitals = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // Core Web Vitals measurement
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
      
      const sendMetrics = (name: string, value: number, rating: string) => {
        // Only send in production or when explicitly enabled
        if (process.env.NODE_ENV === 'production') {
          // Send to your analytics service (PostHog, Google Analytics, etc.)
          if (window.gtag) {
            window.gtag('event', name, {
              event_category: 'Web Vitals',
              event_label: rating,
              value: Math.round(name === 'CLS' ? value * 1000 : value),
              non_interaction: true,
            });
          }
          
          // Send to PostHog if available
          if (window.posthog) {
            window.posthog.capture('web_vital', {
              metric: name,
              value: value,
              rating: rating,
            });
          }
        }
      };

      // Measure each Core Web Vital
      getCLS(({ name, value, rating }) => sendMetrics(name, value, rating));
      getFID(({ name, value, rating }) => sendMetrics(name, value, rating));
      getFCP(({ name, value, rating }) => sendMetrics(name, value, rating));
      getLCP(({ name, value, rating }) => sendMetrics(name, value, rating));
      getTTFB(({ name, value, rating }) => sendMetrics(name, value, rating));
    } catch (error) {
      // web-vitals library not available, use Performance API
      measureWithPerformanceAPI();
    }
  }, []);

  const measureWithPerformanceAPI = useCallback(() => {
    if (!('performance' in window)) return;

    const perfData: PerformanceMetrics = {};

    // Navigation timing
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      perfData.navigationTiming = navigationTiming;
      
      // Calculate key metrics
      const metrics = {
        dns: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
        tcp: navigationTiming.connectEnd - navigationTiming.connectStart,
        request: navigationTiming.responseStart - navigationTiming.requestStart,
        response: navigationTiming.responseEnd - navigationTiming.responseStart,
        dom: navigationTiming.domContentLoadedEventStart - navigationTiming.domLoading,
        load: navigationTiming.loadEventStart - navigationTiming.domContentLoadedEventStart,
        total: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
      };

      // Log performance insights in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🚀 Performance Metrics');
        console.log('DNS Lookup:', `${metrics.dns}ms`);
        console.log('TCP Connection:', `${metrics.tcp}ms`);
        console.log('Request Time:', `${metrics.request}ms`);
        console.log('Response Time:', `${metrics.response}ms`);
        console.log('DOM Processing:', `${metrics.dom}ms`);
        console.log('Load Events:', `${metrics.load}ms`);
        console.log('Total Time:', `${metrics.total}ms`);
        console.groupEnd();
      }
    }

    // Paint timing
    const paintTiming = performance.getEntriesByType('paint') as PerformancePaintTiming[];
    if (paintTiming.length > 0) {
      perfData.paintTiming = paintTiming;
      
      if (process.env.NODE_ENV === 'development') {
        console.group('🎨 Paint Timing');
        paintTiming.forEach(({ name, startTime }) => {
          console.log(`${name}:`, `${Math.round(startTime)}ms`);
        });
        console.groupEnd();
      }
    }

    // Memory usage (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      perfData.memoryInfo = memory;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🧠 Memory Usage:', `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
      }
    }

    return perfData;
  }, []);

  const logResourceTiming = useCallback(() => {
    if (!('performance' in window)) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const largeResources = resources
      .filter(resource => resource.transferSize > 100000) // > 100KB
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, 10); // Top 10

    if (largeResources.length > 0 && process.env.NODE_ENV === 'development') {
      console.group('📦 Large Resources (>100KB)');
      largeResources.forEach(resource => {
        console.log(
          `${resource.name.split('/').pop()}:`,
          `${Math.round(resource.transferSize / 1024)}KB`,
          `(${Math.round(resource.duration)}ms)`
        );
      });
      console.groupEnd();
    }
  }, []);

  const measureComponentPerformance = useCallback((componentName: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 16 && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Slow component render: ${componentName} took ${Math.round(duration)}ms`);
    }
    
    return duration;
  }, []);

  useEffect(() => {
    // Delay measurements to avoid affecting initial performance
    const timer = setTimeout(() => {
      measureWebVitals();
      logResourceTiming();
    }, 2000);

    return () => clearTimeout(timer);
  }, [measureWebVitals, logResourceTiming]);

  return {
    measureWebVitals,
    measureWithPerformanceAPI,
    logResourceTiming,
    measureComponentPerformance,
  };
};

export default usePerformanceMonitoring;