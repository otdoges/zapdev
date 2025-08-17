/**
 * Performance Utility Functions
 * Extracted from EnhancedChatInterface for better code organization
 */

// Performance utility functions
export const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(func: T, limit: number): T => {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

// Memory monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as { memory: { usedJSHeapSize: number } }).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }
  
  logPerformanceMetrics(componentName: string): void {
    const memory = this.measureMemoryUsage();
    console.log(`[PERFORMANCE] ${componentName}: ${(memory / 1024 / 1024).toFixed(2)} MB`);
  }
}