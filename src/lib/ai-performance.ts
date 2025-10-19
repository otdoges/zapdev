/**
 * Performance monitoring utilities for AI operations
 */

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  tokensUsed?: number;
  modelUsed?: string;
  timestamp: Date;
}

const performanceMetrics: PerformanceMetrics[] = [];

export async function measureAIPerformance<T>(
  operation: string,
  modelUsed: string,
  fn: () => Promise<T>
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const start = Date.now();
  let success = false;
  let result: T;
  
  try {
    result = await fn();
    success = true;
  } catch (error) {
    console.error(`[AI-PERF] ${operation} failed:`, error);
    throw error;
  } finally {
    const duration = Date.now() - start;
    const metrics: PerformanceMetrics = {
      operation,
      duration,
      success,
      modelUsed,
      timestamp: new Date(),
    };
    
    performanceMetrics.push(metrics);
    
    console.log(
      `[AI-PERF] ${operation} ${success ? 'completed' : 'failed'} in ${duration}ms using ${modelUsed}`
    );
  }
  
  return { result: result!, metrics: performanceMetrics[performanceMetrics.length - 1] };
}

export function getPerformanceStats() {
  if (performanceMetrics.length === 0) {
    return null;
  }
  
  const totalDuration = performanceMetrics.reduce((sum, m) => sum + m.duration, 0);
  const avgDuration = totalDuration / performanceMetrics.length;
  const successRate = performanceMetrics.filter(m => m.success).length / performanceMetrics.length;
  
  const byModel = performanceMetrics.reduce((acc, m) => {
    if (!m.modelUsed) return acc;
    
    if (!acc[m.modelUsed]) {
      acc[m.modelUsed] = { count: 0, totalDuration: 0, avgDuration: 0 };
    }
    
    acc[m.modelUsed].count++;
    acc[m.modelUsed].totalDuration += m.duration;
    acc[m.modelUsed].avgDuration = acc[m.modelUsed].totalDuration / acc[m.modelUsed].count;
    
    return acc;
  }, {} as Record<string, { count: number; totalDuration: number; avgDuration: number }>);
  
  return {
    totalOperations: performanceMetrics.length,
    avgDuration,
    successRate,
    byModel,
    recentMetrics: performanceMetrics.slice(-10),
  };
}

export function logPerformanceReport() {
  const stats = getPerformanceStats();
  
  if (!stats) {
    console.log('[AI-PERF] No performance data collected yet');
    return;
  }
  
  console.log('\n=== AI Performance Report ===');
  console.log(`Total Operations: ${stats.totalOperations}`);
  console.log(`Average Duration: ${Math.round(stats.avgDuration)}ms`);
  console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
  
  console.log('\nPerformance by Model:');
  Object.entries(stats.byModel).forEach(([model, data]) => {
    console.log(`  ${model}: ${data.count} ops, avg ${Math.round(data.avgDuration)}ms`);
  });
  
  console.log('\nRecent Operations:');
  stats.recentMetrics.forEach(m => {
    console.log(`  ${m.operation}: ${m.duration}ms (${m.modelUsed})`);
  });
  console.log('===========================\n');
}