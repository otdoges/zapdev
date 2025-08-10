import * as Sentry from '@sentry/react';
import * as React from 'react';
import { costTracker } from './ai';

type SentryWithMetrics = typeof Sentry & {
  metrics?: {
    distribution: (
      name: string,
      value: number,
      options?: { tags?: Record<string, string> }
    ) => void;
    increment: (
      name: string,
      value?: number,
      options?: { tags?: Record<string, string> }
    ) => void;
    gauge: (
      name: string,
      value: number,
      options?: { tags?: Record<string, string> }
    ) => void;
  };
};

const SentryMetrics = Sentry as SentryWithMetrics;

const { logger } = Sentry;

export interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  avgTokensUsed: number;
  tokenSamples: number;
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
  timestamp?: number;
}

class AIMonitoringService {
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly BUFFER_SIZE = 100;

  private flushTimer?: ReturnType<typeof setInterval>;
  private performanceBuffer: AIPerformanceData[] = [];
  private metrics: Map<string, AIMetrics> = new Map();

  private beforeUnloadHandler = () => {
    void this.flush();
  };

  constructor() {
    this.startPeriodicFlush();
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
    void this.flush();
  }

  recordOperation(data: AIPerformanceData): void {
    const key = `${data.operation}::${data.model}`;
    const currentMetrics = this.metrics.get(key) ?? this.createEmptyMetrics();

    const previousCount = currentMetrics.totalRequests;
    currentMetrics.totalRequests = previousCount + 1;

    if (data.success) {
      currentMetrics.successfulRequests += 1;
    } else {
      currentMetrics.failedRequests += 1;
    }

    currentMetrics.avgResponseTime =
      (currentMetrics.avgResponseTime * previousCount + data.duration) /
      (previousCount + 1);

    if (
      typeof data.inputTokens === 'number' &&
      typeof data.outputTokens === 'number'
    ) {
      const totalTokens = data.inputTokens + data.outputTokens;
      const prevSamples = currentMetrics.tokenSamples;
      currentMetrics.tokenSamples = prevSamples + 1;
      currentMetrics.avgTokensUsed =
        (currentMetrics.avgTokensUsed * prevSamples + totalTokens) /
        (prevSamples + 1);
    }

    if (typeof data.cost === 'number') {
      currentMetrics.totalCost += data.cost;
    }

    currentMetrics.errorRate =
      currentMetrics.totalRequests > 0
        ? (currentMetrics.failedRequests / currentMetrics.totalRequests) * 100
        : 0;
    currentMetrics.lastUpdated = Date.now();

    this.metrics.set(key, currentMetrics);

    this.performanceBuffer.push({
      ...data,
      timestamp: data.timestamp ?? Date.now(),
    });

    if (this.performanceBuffer.length >= this.BUFFER_SIZE) {
      void this.flush();
    }

    if (!data.success) {
      logger.error('AI Operation Failed', {
        operation: data.operation,
        model: data.model,
        error: data.error,
        errorCode: data.errorCode,
        duration: data.duration,
      });
    } else if (data.duration > 10000) {
      logger.warn('Slow AI Operation', {
        operation: data.operation,
        model: data.model,
        duration: data.duration,
      });
    }

    if (!data.success && data.errorCode === 'QUOTA_EXCEEDED') {
      this.sendCriticalAlert('AI Quota Exceeded', {
        operation: data.operation,
        model: data.model,
        errorCode: data.errorCode,
        duration: data.duration,
      });
    }
  }

  getMetrics(): Map<string, AIMetrics>;
  getMetrics(operation: string, model: string): AIMetrics | undefined;
  getMetrics(operation?: string, model?: string): Map<string, AIMetrics> | AIMetrics | undefined {
    if (typeof operation === 'string' && typeof model === 'string') {
      const key = `${operation}::${model}`;
      return this.metrics.get(key);
    }
    return this.metrics;
  }

  getInsights(): {
    topErrors: Array<{ error: string; count: number }>;
    slowestOperations: Array<{ operation: string; avgTime: number }>;
    costBreakdown: Array<{ model: string; totalCost: number }>;
    healthScore: number;
  } {
    const errorCounts = new Map<string, number>();
    for (const entry of this.performanceBuffer) {
      if (!entry.success && entry.error) {
        errorCounts.set(entry.error, (errorCounts.get(entry.error) || 0) + 1);
      }
    }

    const topErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    const operationTimes = new Map<string, { total: number; count: number }>();
    this.metrics.forEach((metricData, key) => {
      const [operation] = key.split('::');
      const existing = operationTimes.get(operation) ?? { total: 0, count: 0 };
      existing.total += metricData.avgResponseTime * metricData.totalRequests;
      existing.count += metricData.totalRequests;
      operationTimes.set(operation, existing);
    });

    const slowestOperations = Array.from(operationTimes.entries())
      .map(([operation, aggregate]) => ({
        operation,
        avgTime: aggregate.count > 0 ? aggregate.total / aggregate.count : 0,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    const costByModel = new Map<string, number>();
    this.metrics.forEach((metricData, key) => {
      const [, model] = key.split('::');
      costByModel.set(
        model,
        (costByModel.get(model) || 0) + metricData.totalCost
      );
    });

    const costBreakdown = Array.from(costByModel.entries())
      .map(([model, totalCost]) => ({ model, totalCost }))
      .sort((a, b) => b.totalCost - a.totalCost);

    let totalFailed = 0;
    let totalRequests = 0;
    this.metrics.forEach(m => {
      totalFailed += m.failedRequests;
      totalRequests += m.totalRequests;
    });

    const overallErrorRate =
      totalRequests > 0 ? (totalFailed / totalRequests) * 100 : 0;
    const healthScore = Math.max(0, 100 - overallErrorRate * 2);

    return {
      topErrors,
      slowestOperations,
      costBreakdown,
      healthScore,
    };
  }

  private async flush(): Promise<void> {
    if (this.performanceBuffer.length === 0) return;

    const buffer = [...this.performanceBuffer];
    const metrics = new Map(this.metrics);

    try {
      for (const data of buffer) {
        SentryMetrics.metrics?.distribution(
          'ai.operation.duration',
          data.duration,
          {
            tags: {
              operation: data.operation,
              model: data.model,
              success: String(data.success),
              cache_hit: String(data.cacheHit || false),
            },
          }
        );

        if (typeof data.cost === 'number') {
          SentryMetrics.metrics?.distribution('ai.operation.cost', data.cost, {
            tags: { operation: data.operation, model: data.model },
          });
        }

        if (
          typeof data.inputTokens === 'number' &&
          typeof data.outputTokens === 'number'
        ) {
          SentryMetrics.metrics?.distribution(
            'ai.tokens.total',
            data.inputTokens + data.outputTokens,
            { tags: { operation: data.operation, model: data.model } }
          );
        }
      }

      metrics.forEach((metricData, key) => {
        const [operation, model] = key.split('::');

        SentryMetrics.metrics?.gauge('ai.metrics.error_rate', metricData.errorRate, {
          tags: { operation, model },
        });

        SentryMetrics.metrics?.gauge(
          'ai.metrics.avg_response_time',
          metricData.avgResponseTime,
          { tags: { operation, model } }
        );

        SentryMetrics.metrics?.gauge('ai.metrics.total_cost', metricData.totalCost, {
          tags: { operation, model },
        });
      });

      // Compute insights before clearing the buffer so topErrors are correct
      const insights = this.getInsights();
      logger.info('AI Performance Insights', insights);

      SentryMetrics.metrics?.gauge('ai.health.score', insights.healthScore);

      if (insights.healthScore < 50) {
        this.sendCriticalAlert('AI Health Score Critical', {
          healthScore: insights.healthScore,
          insights,
        });
      }

      const dailyCost = costTracker.getTodayCost();
      const dailyLimit = costTracker.getDailyLimit();
      const costPercentage = costTracker.getCostPercentage();

      SentryMetrics.metrics?.gauge('ai.cost.daily', dailyCost);
      SentryMetrics.metrics?.gauge('ai.cost.percentage', costPercentage);

      if (costTracker.isNearLimit()) {
        this.sendCriticalAlert('AI Daily Cost Near Limit', {
          dailyCost,
          dailyLimit,
          percentage: costPercentage,
        });
      }
    } catch (error) {
      logger.error('Failed to flush AI monitoring data', error);
    }
    // Clear buffer only after insights are computed and processed
    this.performanceBuffer = [];
  }

  private sendCriticalAlert(
    message: string,
    data: Record<string, unknown>
  ): void {
    Sentry.captureMessage(message, {
      level: 'error',
      tags: {
        category: 'ai_monitoring',
        alert_type: 'critical',
      },
      extra: data,
    });

    logger.error(`CRITICAL ALERT: ${message}`, data);
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private createEmptyMetrics(): AIMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      avgTokensUsed: 0,
      tokenSamples: 0,
      totalCost: 0,
      errorRate: 0,
      lastUpdated: Date.now(),
    };
  }
}

export const aiMonitoring = new AIMonitoringService();

export function useAIMonitoring() {
  const [metrics, setMetrics] = React.useState<Map<string, AIMetrics>>(new Map());
  const [insights, setInsights] = React.useState(aiMonitoring.getInsights());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(new Map(aiMonitoring.getMetrics()));
      setInsights(aiMonitoring.getInsights());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, insights };
}
