// Performance testing utilities for chat interface
import React from 'react';
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render times
  measureRender(componentName: string, fn: () => void): void {
    const start = performance.now();
    fn();
    const end = performance.now();
    this.addMetric(`render-${componentName}`, end - start);
  }

  // Measure memory usage
  measureMemory(label: string): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.addMetric(`memory-${label}`, memory.usedJSHeapSize);
    }
  }

  // Start monitoring specific performance entries
  startMonitoring(type: string): void {
    if (this.observers.has(type)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.addMetric(`${type}-${entry.name}`, entry.duration || entry.startTime);
      }
    });

    try {
      observer.observe({ entryTypes: [type] });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  // Stop monitoring
  stopMonitoring(type: string): void {
    const observer = this.observers.get(type);
    if (observer) {
      observer.disconnect();
      this.observers.delete(type);
    }
  }

  private addMetric(key: string, value: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(value);
  }

  // Get performance report
  getReport(): Record<string, { count: number; avg: number; min: number; max: number }> {
    const report: Record<string, { count: number; avg: number; min: number; max: number }> = {};

    for (const [key, values] of this.metrics.entries()) {
      const count = values.length;
      const avg = values.reduce((a, b) => a + b, 0) / count;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      Object.defineProperty(report, key, { 
        value: { count, avg, min, max }, 
        writable: true, 
        enumerable: true, 
        configurable: true 
      });
    }

    return report;
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }

  // Log performance report to console
  logReport(): void {
    const report = this.getReport();
    console.group('🚀 Performance Report');
    
    for (const [metric, stats] of Object.entries(report)) {
      console.log(`${metric}:`, {
        count: stats.count,
        avg: `${stats.avg.toFixed(2)}ms`,
        min: `${stats.min.toFixed(2)}ms`,
        max: `${stats.max.toFixed(2)}ms`
      });
    }
    
    console.groupEnd();
  }
}

// Hook for measuring React component performance
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  React.useEffect(() => {
    monitor.measureMemory(`${componentName}-mount`);
    return () => {
      monitor.measureMemory(`${componentName}-unmount`);
    };
  }, [monitor, componentName]);

  const measureRender = React.useCallback((fn: () => void) => {
    monitor.measureRender(componentName, fn);
  }, [monitor, componentName]);

  return { measureRender };
}

// Performance testing for chat interface
export function runChatPerformanceTest() {
  const monitor = PerformanceMonitor.getInstance();
  
  console.log('🧪 Starting Chat Performance Test...');
  
  // Start monitoring various performance metrics
  monitor.startMonitoring('measure');
  monitor.startMonitoring('navigation');
  
  // Simulate chat operations
  const testOperations = [
    'message-render',
    'scroll-to-bottom', 
    'code-block-extraction',
    'input-validation',
    'clipboard-copy'
  ];

  testOperations.forEach(operation => {
    // Simulate the operation with a small delay
    monitor.measureRender(operation, () => {
      // Simulate work
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }
    });
  });

  // Report results after a delay
  setTimeout(() => {
    monitor.stopMonitoring('measure');
    monitor.stopMonitoring('navigation');
    monitor.logReport();
    console.log('✅ Chat Performance Test Complete');
  }, 1000);
}

// Utility to measure the performance impact of animations
export function measureAnimationPerformance(element: HTMLElement, duration: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    const start = performance.now();
    
    function countFrames() {
      frameCount++;
      if (performance.now() - start < duration) {
        requestAnimationFrame(countFrames);
      } else {
        const fps = (frameCount / duration) * 1000;
        resolve(fps);
      }
    }
    
    requestAnimationFrame(countFrames);
  });
}
