import * as Sentry from '@sentry/react';
import { costTracker } from './ai';

type SentryWithMetrics = typeof Sentry & {
  metrics?: {
    distribution: (name: string, value: number, options?: unknown) => void;
    increment: (name: string, value?: number, options?: unknown) => void;
    gauge: (name: string, value: number, options?: unknown) => void;
  };
};

const SentryMetrics = Sentry as SentryWithMetrics;

/**
 * Production-grade AI monitoring and observability
 */

const { logger } = Sentry;

export interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  avgTokensUsed: number;
  totalCost: number;
  errorRate: number;
  lastUpdated: number;
}

export interface AIPerformanceData {
  operation: string;
  model: string;
  duration: number;
  success: boolean;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  error?: string;
  errorCode?: string;
  retryCount?: number;
  cacheHit?: boolean;
}

class AIMonitoringService {
  private metrics: Map<string, AIMetrics> = new Map();
  private performanceBuffer: AIPerformanceData[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;
  
  constructor() {
    // Start periodic flush
    this.startPeriodicFlush();
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }
  
  /**
   * Record AI operation performance
   */
  recordOperation(data: AIPerformanceData): void {
    // Update metrics
    const key = `${data.operation}_${data.model}`;
    const metrics = this.metrics.get(key) || this.createEmptyMetrics();
    
    metrics.totalRequests++;
    if (data.success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }
    
    // Update averages
    const totalDuration = metrics.avgResponseTime * (metrics.totalRequests - 1) + data.duration;
    metrics.avgResponseTime = totalDuration / metrics.totalRequests;
    
    if (data.inputTokens && data.outputTokens) {
      const totalTokens = data.inputTokens + data.outputTokens;
      const avgTotal = metrics.avgTokensUsed * (metrics.totalRequests - 1) + totalTokens;
      metrics.avgTokensUsed = avgTotal / metrics.totalRequests;
    }
    
    if (data.cost) {
      metrics.totalCost += data.cost;
    }
    
    metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
    metrics.lastUpdated = Date.now();
    
    this.metrics.set(key, metrics);
    
    // Add to performance buffer
    this.performanceBuffer.push({
      ...data,
      timestamp: Date.now()
    } as AIPerformanceData);
    
    // Flush if buffer is full
    if (this.performanceBuffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }
    
    // Log significant events
    if (!data.success) {
      logger.error('AI Operation Failed', {
        operation: data.operation,
        model: data.model,
        error: data.error,
        errorCode: data.errorCode,
        duration: data.duration
      });
    } else if (data.duration > 10000) { // Slow operation (>10s)
      logger.warn('Slow AI Operation', {
        operation: data.operation,
        model: data.model,
        duration: data.duration
      });
    }
    
    // Send real-time metrics for critical failures
    if (!data.success && data.errorCode === 'QUOTA_EXCEEDED') {
      this.sendCriticalAlert('AI Quota Exceeded', {
        operation: data.operation,
        model: data.model,
        errorCode: data.errorCode,
        duration: data.duration
      });
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics(operation?: string, model?: string): Map<string, AIMetrics> | AIMetrics | null {
    if (operation && model) {
      const key = `${operation}_${model}`;
      return this.metrics.get(key) || null;
    }
    return this.metrics;
  }
  
  /**
   * Get performance insights
   */
  getInsights(): {
    topErrors: Array<{ error: string; count: number }>;
    slowestOperations: Array<{ operation: string; avgTime: number }>;
    costBreakdown: Array<{ model: string; totalCost: number }>;
    healthScore: number;
  } {
    // Analyze error patterns
    const errorCounts = new Map<string, number>();
    this.performanceBuffer.forEach(data => {
      if (!data.success && data.error) {
        errorCounts.set(data.error, (errorCounts.get(data.error) || 0) + 1);
      }
    });
    
    const topErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
    
    // Find slowest operations
    const operationTimes = new Map<string, { total: number; count: number }>();
    this.metrics.forEach((metrics, key) => {
      const [operation] = key.split('_');
      const existing = operationTimes.get(operation) || { total: 0, count: 0 };
      existing.total += metrics.avgResponseTime * metrics.totalRequests;
      existing.count += metrics.totalRequests;
      operationTimes.set(operation, existing);
    });
    
    const slowestOperations = Array.from(operationTimes.entries())
      .map(([operation, data]) => ({ 
        operation, 
        avgTime: data.total / data.count 
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
    
    // Cost breakdown by model
    const costByModel = new Map<string, number>();
    this.metrics.forEach((metrics, key) => {
      const [, model] = key.split('_');
      costByModel.set(model, (costByModel.get(model) || 0) + metrics.totalCost);
    });
    
    const costBreakdown = Array.from(costByModel.entries())
      .map(([model, totalCost]) => ({ model, totalCost }))
      .sort((a, b) => b.totalCost - a.totalCost);
    
    // Calculate health score (0-100)
    let totalErrorRate = 0;
    let totalRequests = 0;
    this.metrics.forEach(metrics => {
      totalErrorRate += metrics.failedRequests;
      totalRequests += metrics.totalRequests;
    });
    
    const overallErrorRate = totalRequests > 0 ? (totalErrorRate / totalRequests) * 100 : 0;
    const healthScore = Math.max(0, 100 - (overallErrorRate * 2)); // 50% error rate = 0 health
    
    return {
      topErrors,
      slowestOperations,
      costBreakdown,
      healthScore
    };
  }
  
  /**
   * Send monitoring data to backend
   */
  private async flush(): Promise<void> {
    if (this.performanceBuffer.length === 0) return;
    
    const buffer = [...this.performanceBuffer];
    const metrics = new Map(this.metrics);
    
    // Clear buffer
    this.performanceBuffer = [];
    
    try {
      // Send to Sentry as custom metrics (if available)
      buffer.forEach(data => {
        SentryMetrics.metrics?.distribution('ai.operation.duration', data.duration, {
          tags: {
            operation: data.operation,
            model: data.model,
            success: String(data.success),
            cache_hit: String(data.cacheHit || false)
          }
        });

        if (data.cost) {
          SentryMetrics.metrics?.distribution('ai.operation.cost', data.cost, {
            tags: {
              operation: data.operation,
              model: data.model
            }
          });
        }

        if (data.inputTokens && data.outputTokens) {
          SentryMetrics.metrics?.distribution('ai.tokens.total', data.inputTokens + data.outputTokens, {
            tags: {
              operation: data.operation,
              model: data.model
            }
          });
        }
      });
      
      // Send aggregated metrics
      metrics.forEach((metricData, key) => {
        const [operation, model] = key.split('_');
        
        SentryMetrics.metrics?.gauge('ai.metrics.error_rate', metricData.errorRate, {
          tags: { operation, model }
        });
        
        SentryMetrics.metrics?.gauge('ai.metrics.avg_response_time', metricData.avgResponseTime, {
          tags: { operation, model }
        });
        
        SentryMetrics.metrics?.gauge('ai.metrics.total_cost', metricData.totalCost, {
          tags: { operation, model }
        });
      });
      
      // Log insights periodically
      const insights = this.getInsights();
      logger.info('AI Performance Insights', insights);
      
      // Send health score
      SentryMetrics.metrics?.gauge('ai.health.score', insights.healthScore);
      
      // Check for critical conditions
      if (insights.healthScore < 50) {
        this.sendCriticalAlert('AI Health Score Critical', {
          healthScore: insights.healthScore,
          insights
        });
      }
      
      // Check daily cost
      const dailyCost = costTracker.getTodayCost();
      const dailyLimit = costTracker.getDailyLimit();
      const costPercentage = costTracker.getCostPercentage();
      
      SentryMetrics.metrics?.gauge('ai.cost.daily', dailyCost);
      SentryMetrics.metrics?.gauge('ai.cost.percentage', costPercentage);
      
      if (costTracker.isNearLimit()) {
        this.sendCriticalAlert('AI Daily Cost Near Limit', {
          dailyCost,
          dailyLimit,
          percentage: costPercentage
        });
      }
      
    } catch (error) {
      logger.error('Failed to flush AI monitoring data', error);
    }
  }
  
  /**
   * Send critical alerts
   */
  private sendCriticalAlert(message: string, data: Record<string, unknown>): void {
    Sentry.captureMessage(message, {
      level: 'error',
      tags: {
        category: 'ai_monitoring',
        alert_type: 'critical'
      },
      extra: data
    });
    
    // In production, this could trigger PagerDuty, Slack, etc.
    logger.error(`CRITICAL ALERT: ${message}`, data);
  }
  
  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }
  
  /**
   * Stop monitoring (cleanup)
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
  
  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): AIMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      avgTokensUsed: 0,
      totalCost: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    };
  }
}

// Singleton instance
export const aiMonitoring = new AIMonitoringService();

/**
 * React hook for AI monitoring dashboard
 */
export function useAIMonitoring() {
  const [metrics, setMetrics] = React.useState<Map<string, AIMetrics>>(new Map());
  const [insights, setInsights] = React.useState(aiMonitoring.getInsights());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(new Map(aiMonitoring.getMetrics() as Map<string, AIMetrics>));
      setInsights(aiMonitoring.getInsights());
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return { metrics, insights };
}

// Import React for the hook
import * as React from 'react';