import { AutonomousPipeline } from './autonomous-pipeline';
import { BackgroundOrchestrator } from './background-orchestrator';
import { RealtimeMonitor } from './realtime-monitor';
import { trackFeatureUsage } from './posthog';

export interface PerformanceMetric {
  id: string;
  metricType: 'cpu' | 'memory' | 'network' | 'disk' | 'latency' | 'throughput' | 'error_rate';
  value: number;
  unit: string;
  timestamp: Date;
  source: 'system' | 'application' | 'database' | 'ai_model' | 'user_action';
  threshold?: {
    warning: number;
    critical: number;
  };
  tags?: Record<string, string>;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'code_optimization' | 'resource_scaling' | 'caching' | 'database_tuning' | 'ai_model_optimization';
  title: string;
  description: string;
  impact: {
    performance: number; // Expected % improvement
    cost: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
  };
  implementation: {
    steps: string[];
    estimatedTime: number; // minutes
    requirements: string[];
    rollbackPlan: string;
  };
  evidence: {
    metrics: string[]; // Metric IDs that support this recommendation
    benchmarks: any[];
    confidence: number; // 0-1
  };
  status: 'pending' | 'approved' | 'implementing' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  implementedAt?: Date;
  results?: {
    actualImprovement: number;
    sideEffects: string[];
    success: boolean;
  };
}

export interface PerformanceBenchmark {
  id: string;
  name: string;
  category: 'response_time' | 'throughput' | 'resource_usage' | 'ai_accuracy' | 'user_satisfaction';
  baseline: number;
  target: number;
  current: number;
  unit: string;
  trend: 'improving' | 'stable' | 'degrading';
  measurements: Array<{
    timestamp: Date;
    value: number;
    context?: string;
  }>;
  lastUpdated: Date;
}

export interface AutoScalingRule {
  id: string;
  name: string;
  enabled: boolean;
  resource: 'agents' | 'jobs' | 'connections' | 'memory' | 'cpu';
  trigger: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==';
    threshold: number;
    duration: number; // seconds
  };
  action: {
    type: 'scale_up' | 'scale_down' | 'restart' | 'alert' | 'optimize';
    parameters: Record<string, any>;
    cooldown: number; // seconds before next action
  };
  constraints: {
    minValue?: number;
    maxValue?: number;
    timeWindows?: Array<{ start: string; end: string; days: string[] }>;
  };
  subscriptionLevel: 'free' | 'pro' | 'enterprise';
}

export interface PerformanceAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metricId: string;
  currentValue: number;
  threshold: number;
  duration: number; // How long the condition has persisted
  acknowledged: boolean;
  resolvedAt?: Date;
  actions: Array<{
    type: 'auto_scale' | 'optimization' | 'notification' | 'restart';
    executed: boolean;
    result?: string;
  }>;
  timestamp: Date;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private pipeline: AutonomousPipeline;
  private orchestrator: BackgroundOrchestrator;
  private monitor: RealtimeMonitor;

  private metrics: Map<string, PerformanceMetric> = new Map();
  private recommendations: Map<string, OptimizationRecommendation> = new Map();
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private scalingRules: Map<string, AutoScalingRule> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();

  private metricsCollectionInterval?: NodeJS.Timeout;
  private optimizationInterval?: NodeJS.Timeout;
  private alertCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.pipeline = AutonomousPipeline.getInstance();
    this.orchestrator = BackgroundOrchestrator.getInstance();
    this.monitor = RealtimeMonitor.getInstance();

    this.initializeBenchmarks();
    this.initializeScalingRules();
    this.startOptimization();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Initialize default performance benchmarks
   */
  private initializeBenchmarks() {
    const defaultBenchmarks: PerformanceBenchmark[] = [
      {
        id: 'api_response_time',
        name: 'API Response Time',
        category: 'response_time',
        baseline: 500, // 500ms baseline
        target: 200, // Target 200ms
        current: 500,
        unit: 'ms',
        trend: 'stable',
        measurements: [],
        lastUpdated: new Date()
      },
      {
        id: 'task_completion_rate',
        name: 'Task Completion Rate',
        category: 'throughput',
        baseline: 0.8, // 80% baseline
        target: 0.95, // Target 95%
        current: 0.8,
        unit: 'percentage',
        trend: 'stable',
        measurements: [],
        lastUpdated: new Date()
      },
      {
        id: 'agent_utilization',
        name: 'Agent Utilization',
        category: 'resource_usage',
        baseline: 0.6, // 60% baseline
        target: 0.8, // Target 80%
        current: 0.6,
        unit: 'percentage',
        trend: 'stable',
        measurements: [],
        lastUpdated: new Date()
      },
      {
        id: 'ai_model_accuracy',
        name: 'AI Model Accuracy',
        category: 'ai_accuracy',
        baseline: 0.85, // 85% baseline
        target: 0.95, // Target 95%
        current: 0.85,
        unit: 'percentage',
        trend: 'stable',
        measurements: [],
        lastUpdated: new Date()
      }
    ];

    defaultBenchmarks.forEach(benchmark => {
      this.benchmarks.set(benchmark.id, benchmark);
    });
  }

  /**
   * Initialize default auto-scaling rules
   */
  private initializeScalingRules() {
    const defaultRules: AutoScalingRule[] = [
      {
        id: 'scale_agents_high_load',
        name: 'Scale Agents on High Load',
        enabled: true,
        resource: 'agents',
        trigger: {
          metric: 'agent_utilization',
          operator: '>',
          threshold: 0.9,
          duration: 300 // 5 minutes
        },
        action: {
          type: 'scale_up',
          parameters: { increment: 2 },
          cooldown: 600 // 10 minutes
        },
        constraints: {
          maxValue: 16,
          minValue: 4
        },
        subscriptionLevel: 'pro'
      },
      {
        id: 'scale_down_low_load',
        name: 'Scale Down on Low Load',
        enabled: true,
        resource: 'agents',
        trigger: {
          metric: 'agent_utilization',
          operator: '<',
          threshold: 0.3,
          duration: 900 // 15 minutes
        },
        action: {
          type: 'scale_down',
          parameters: { decrement: 1 },
          cooldown: 1800 // 30 minutes
        },
        constraints: {
          maxValue: 16,
          minValue: 4
        },
        subscriptionLevel: 'free'
      },
      {
        id: 'restart_on_high_error_rate',
        name: 'Restart on High Error Rate',
        enabled: true,
        resource: 'jobs',
        trigger: {
          metric: 'error_rate',
          operator: '>',
          threshold: 0.1, // 10% error rate
          duration: 180 // 3 minutes
        },
        action: {
          type: 'restart',
          parameters: { component: 'orchestrator' },
          cooldown: 300 // 5 minutes
        },
        constraints: {},
        subscriptionLevel: 'enterprise'
      }
    ];

    defaultRules.forEach(rule => {
      this.scalingRules.set(rule.id, rule);
    });
  }

  /**
   * Start the optimization system
   */
  private startOptimization() {
    // Collect metrics every 5 minutes to reduce costs
    this.metricsCollectionInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, 300000); // 5 minutes

    // Run optimization analysis every 15 minutes
    this.optimizationInterval = setInterval(() => {
      this.analyzePerformance();
      this.generateOptimizationRecommendations();
      this.updateBenchmarks();
    }, 900000); // 15 minutes

    // Check alerts every 5 minutes
    this.alertCheckInterval = setInterval(() => {
      this.checkPerformanceAlerts();
      this.executeAutoScaling();
    }, 300000); // 5 minutes
  }

  /**
   * Collect current performance metrics
   */
  private async collectPerformanceMetrics() {
    const timestamp = new Date();

    try {
      // Get system metrics
      const pipelineStats = this.pipeline.getStats();
      const orchestratorStats = this.orchestrator.getStats();
      const monitorStats = this.monitor.getCurrentMetrics();

      // Collect AI pipeline metrics
      this.recordMetric({
        id: `agent_utilization_${timestamp.getTime()}`,
        metricType: 'throughput',
        value: pipelineStats.agentUtilization,
        unit: 'percentage',
        timestamp,
        source: 'application',
        threshold: { warning: 0.8, critical: 0.95 },
        tags: { component: 'pipeline' }
      });

      this.recordMetric({
        id: `task_completion_rate_${timestamp.getTime()}`,
        metricType: 'throughput',
        value: pipelineStats.totalTasks > 0 ? pipelineStats.completedTasks / pipelineStats.totalTasks : 0,
        unit: 'percentage',
        timestamp,
        source: 'application',
        threshold: { warning: 0.7, critical: 0.5 },
        tags: { component: 'pipeline' }
      });

      this.recordMetric({
        id: `error_rate_${timestamp.getTime()}`,
        metricType: 'error_rate',
        value: pipelineStats.totalTasks > 0 ? pipelineStats.failedTasks / pipelineStats.totalTasks : 0,
        unit: 'percentage',
        timestamp,
        source: 'application',
        threshold: { warning: 0.05, critical: 0.1 },
        tags: { component: 'pipeline' }
      });

      // Collect orchestrator metrics
      const jobSuccessRate = orchestratorStats.totalJobs > 0 ? orchestratorStats.completedJobs / orchestratorStats.totalJobs : 0;
      this.recordMetric({
        id: `job_success_rate_${timestamp.getTime()}`,
        metricType: 'throughput',
        value: jobSuccessRate,
        unit: 'percentage',
        timestamp,
        source: 'application',
        threshold: { warning: 0.8, critical: 0.6 },
        tags: { component: 'orchestrator' }
      });

      // Simulate system resource metrics
      this.recordMetric({
        id: `cpu_usage_${timestamp.getTime()}`,
        metricType: 'cpu',
        value: Math.random() * 100, // Simulated CPU usage
        unit: 'percentage',
        timestamp,
        source: 'system',
        threshold: { warning: 70, critical: 90 },
        tags: { resource: 'cpu' }
      });

      this.recordMetric({
        id: `memory_usage_${timestamp.getTime()}`,
        metricType: 'memory',
        value: Math.random() * 100, // Simulated memory usage
        unit: 'percentage',
        timestamp,
        source: 'system',
        threshold: { warning: 80, critical: 95 },
        tags: { resource: 'memory' }
      });

      // Simulate API response time
      const responseTime = 100 + Math.random() * 400; // 100-500ms
      this.recordMetric({
        id: `api_response_time_${timestamp.getTime()}`,
        metricType: 'latency',
        value: responseTime,
        unit: 'ms',
        timestamp,
        source: 'application',
        threshold: { warning: 300, critical: 500 },
        tags: { component: 'api' }
      });

    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: Omit<PerformanceMetric, 'id'> & { id: string }) {
    this.metrics.set(metric.id, metric);

    // Keep only recent metrics (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, m] of this.metrics.entries()) {
      if (m.timestamp.getTime() < oneHourAgo) {
        this.metrics.delete(id);
      }
    }
  }

  /**
   * Analyze current performance and identify issues
   */
  private analyzePerformance() {
    const currentMetrics = this.getCurrentMetricValues();
    
    // Analyze trends
    this.analyzeTrends(currentMetrics);
    
    // Identify bottlenecks
    this.identifyBottlenecks(currentMetrics);
    
    // Compare against benchmarks
    this.compareToBenchmarks(currentMetrics);
  }

  /**
   * Get current metric values grouped by type
   */
  private getCurrentMetricValues(): Record<string, PerformanceMetric[]> {
    const recentMetrics = Array.from(this.metrics.values())
      .filter(m => Date.now() - m.timestamp.getTime() < 5 * 60 * 1000); // Last 5 minutes

    const grouped: Record<string, PerformanceMetric[]> = {};
    for (const metric of recentMetrics) {
      // Fixed: Sanitize user input to prevent format string injection
      const sanitizedMetricType = metric.metricType.replace(/[^a-zA-Z0-9_-]/g, '_');
      const sanitizedComponent = (metric.tags?.component || 'system').replace(/[^a-zA-Z0-9_-]/g, '_');
      const key = `${sanitizedMetricType}_${sanitizedComponent}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(metric);
    }

    return grouped;
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(currentMetrics: Record<string, PerformanceMetric[]>) {
    for (const [key, metrics] of Object.entries(currentMetrics)) {
      if (metrics.length < 3) continue; // Need at least 3 data points

      const sortedMetrics = metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const recent = sortedMetrics.slice(-3);
      
      // Calculate trend
      const trend = this.calculateTrend(recent.map(m => m.value));
      
      // If trend is significantly degrading, create recommendation
      if (trend < -0.1) { // 10% degradation
        this.generateTrendBasedRecommendation(key, trend, recent);
      }
    }
  }

  /**
   * Calculate trend from values (-1 to 1, negative = degrading)
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    
    if (first === 0) return 0;
    return (last - first) / first;
  }

  /**
   * Generate trend-based optimization recommendation
   */
  private generateTrendBasedRecommendation(
    metricKey: string, 
    trend: number, 
    recentMetrics: PerformanceMetric[]
  ) {
    const metricType = recentMetrics[0].metricType;
    const component = recentMetrics[0].tags?.component || 'system';
    
    let recommendation: OptimizationRecommendation;

    if (metricType === 'cpu' && trend > 0.1) {
      recommendation = {
        id: `cpu_optimization_${Date.now()}`,
        type: 'resource_scaling',
        title: 'High CPU Usage Detected',
        description: `CPU usage trending upward (${(trend * 100).toFixed(1)}% increase). Consider scaling or optimizing.`,
        impact: {
          performance: 25,
          cost: 'medium',
          effort: 'low',
          risk: 'low'
        },
        implementation: {
          steps: [
            'Enable auto-scaling for compute resources',
            'Review recent code changes for inefficiencies',
            'Consider implementing caching strategies'
          ],
          estimatedTime: 30,
          requirements: ['Pro subscription for auto-scaling'],
          rollbackPlan: 'Disable auto-scaling if issues occur'
        },
        evidence: {
          metrics: recentMetrics.map(m => m.id),
          benchmarks: [],
          confidence: 0.8
        },
        status: 'pending',
        priority: trend > 0.2 ? 'high' : 'medium',
        createdAt: new Date()
      };
    } else if (metricType === 'error_rate' && trend > 0.1) {
      recommendation = {
        id: `error_rate_optimization_${Date.now()}`,
        type: 'code_optimization',
        title: 'Increasing Error Rate',
        description: `Error rate increasing by ${(trend * 100).toFixed(1)}%. Investigate and fix underlying issues.`,
        impact: {
          performance: 40,
          cost: 'low',
          effort: 'medium',
          risk: 'low'
        },
        implementation: {
          steps: [
            'Review error logs for common patterns',
            'Implement additional error handling',
            'Add circuit breakers for external dependencies',
            'Increase monitoring and alerting'
          ],
          estimatedTime: 120,
          requirements: ['Development team availability'],
          rollbackPlan: 'Revert code changes if error rate increases'
        },
        evidence: {
          metrics: recentMetrics.map(m => m.id),
          benchmarks: [],
          confidence: 0.9
        },
        status: 'pending',
        priority: 'high',
        createdAt: new Date()
      };
    } else {
      return; // No recommendation for this trend
    }

    this.recommendations.set(recommendation.id, recommendation);
  }

  /**
   * Identify system bottlenecks
   */
  private identifyBottlenecks(currentMetrics: Record<string, PerformanceMetric[]>) {
    // Find metrics that are consistently above warning thresholds
    for (const [key, metrics] of Object.entries(currentMetrics)) {
      const aboveThreshold = metrics.filter(m => 
        m.threshold && m.value > m.threshold.warning
      );

      if (aboveThreshold.length > metrics.length * 0.7) { // 70% above threshold
        this.generateBottleneckRecommendation(key, aboveThreshold);
      }
    }
  }

  /**
   * Generate bottleneck-based recommendation
   */
  private generateBottleneckRecommendation(metricKey: string, problematicMetrics: PerformanceMetric[]) {
    const metric = problematicMetrics[0];
    const avgValue = problematicMetrics.reduce((sum, m) => sum + m.value, 0) / problematicMetrics.length;

    let recommendation: OptimizationRecommendation;

    if (metric.metricType === 'throughput' && metric.tags?.component === 'pipeline') {
      recommendation = {
        id: `throughput_bottleneck_${Date.now()}`,
        type: 'resource_scaling',
        title: 'Pipeline Throughput Bottleneck',
        description: `Task completion rate consistently low (${(avgValue * 100).toFixed(1)}%). Need to scale agents or optimize task distribution.`,
        impact: {
          performance: 50,
          cost: 'medium',
          effort: 'low',
          risk: 'low'
        },
        implementation: {
          steps: [
            'Increase number of available agents',
            'Optimize task assignment algorithm',
            'Implement task priority queuing',
            'Add parallel execution for independent tasks'
          ],
          estimatedTime: 60,
          requirements: ['Agent scaling capability'],
          rollbackPlan: 'Reduce agent count if resource constraints occur'
        },
        evidence: {
          metrics: problematicMetrics.map(m => m.id),
          benchmarks: [],
          confidence: 0.85
        },
        status: 'pending',
        priority: 'high',
        createdAt: new Date()
      };

      this.recommendations.set(recommendation.id, recommendation);
    }
  }

  /**
   * Compare current performance to benchmarks
   */
  private compareToBenchmarks(currentMetrics: Record<string, PerformanceMetric[]>) {
    for (const benchmark of this.benchmarks.values()) {
      const relevantMetrics = this.findRelevantMetrics(benchmark, currentMetrics);
      
      if (relevantMetrics.length > 0) {
        const avgValue = relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length;
        
        // Update benchmark current value
        benchmark.current = avgValue;
        
        // Determine trend
        benchmark.measurements.push({
          timestamp: new Date(),
          value: avgValue
        });

        // Keep only last 24 hours of measurements
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        benchmark.measurements = benchmark.measurements.filter(m => m.timestamp.getTime() > dayAgo);

        // Calculate trend
        if (benchmark.measurements.length >= 2) {
          const recent = benchmark.measurements.slice(-5); // Last 5 measurements
          const trend = this.calculateTrend(recent.map(m => m.value));
          
          if (trend > 0.05) benchmark.trend = 'improving';
          else if (trend < -0.05) benchmark.trend = 'degrading';
          else benchmark.trend = 'stable';
        }

        benchmark.lastUpdated = new Date();

        // Generate recommendation if significantly below target
        if (avgValue < benchmark.target * 0.8) { // 20% below target
          this.generateBenchmarkRecommendation(benchmark, avgValue);
        }
      }
    }
  }

  /**
   * Find metrics relevant to a benchmark
   */
  private findRelevantMetrics(
    benchmark: PerformanceBenchmark, 
    currentMetrics: Record<string, PerformanceMetric[]>
  ): PerformanceMetric[] {
    // Simple mapping based on benchmark name to metric types
    const mappings: Record<string, string[]> = {
      'api_response_time': ['latency_api', 'latency_application'],
      'task_completion_rate': ['throughput_pipeline'],
      'agent_utilization': ['throughput_pipeline'],
      'ai_model_accuracy': ['throughput_ai_model']
    };

    const relevantKeys = mappings[benchmark.id] || [];
    const relevantMetrics: PerformanceMetric[] = [];

    for (const key of relevantKeys) {
      if (currentMetrics[key]) {
        relevantMetrics.push(...currentMetrics[key]);
      }
    }

    return relevantMetrics;
  }

  /**
   * Generate benchmark-based recommendation
   */
  private generateBenchmarkRecommendation(benchmark: PerformanceBenchmark, currentValue: number) {
    const gap = ((benchmark.target - currentValue) / benchmark.target) * 100;

    const recommendation: OptimizationRecommendation = {
      id: `benchmark_gap_${benchmark.id}_${Date.now()}`,
      type: 'code_optimization',
      title: `${benchmark.name} Below Target`,
      // Fixed: Sanitize user input to prevent format string injection
      description: `Current ${benchmark.name.toLowerCase().replace(/[<>&"']/g, '')} (${currentValue.toFixed(2)} ${benchmark.unit.replace(/[<>&"']/g, '')}) is ${gap.toFixed(1)}% below target (${benchmark.target} ${benchmark.unit.replace(/[<>&"']/g, '')}).`,
      impact: {
        performance: Math.min(gap, 50), // Up to 50% improvement
        cost: 'medium',
        effort: 'medium',
        risk: 'low'
      },
      implementation: {
        steps: this.generateBenchmarkOptimizationSteps(benchmark),
        estimatedTime: 90,
        requirements: ['Performance analysis tools', 'Development resources'],
        rollbackPlan: 'Monitor for regressions and revert if performance degrades'
      },
      evidence: {
        metrics: [],
        benchmarks: [benchmark],
        confidence: 0.7
      },
      status: 'pending',
      priority: gap > 30 ? 'high' : 'medium',
      createdAt: new Date()
    };

    this.recommendations.set(recommendation.id, recommendation);
  }

  /**
   * Generate optimization steps for a benchmark
   */
  private generateBenchmarkOptimizationSteps(benchmark: PerformanceBenchmark): string[] {
    const stepMappings: Record<string, string[]> = {
      'api_response_time': [
        'Implement response caching for frequent requests',
        'Optimize database queries with proper indexing',
        'Add compression for large responses',
        'Use CDN for static assets'
      ],
      'task_completion_rate': [
        'Optimize task assignment algorithm',
        'Implement task prioritization',
        'Add parallel execution capabilities',
        'Improve error handling and retry logic'
      ],
      'agent_utilization': [
        'Balance workload distribution across agents',
        'Implement dynamic agent scaling',
        'Optimize agent specialization',
        'Add intelligent task routing'
      ]
    };

    return stepMappings[benchmark.id] || [
      'Analyze performance bottlenecks',
      'Implement targeted optimizations',
      'Monitor and validate improvements'
    ];
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations() {
    // AI-powered recommendation generation
    this.generateAIBasedRecommendations();
    
    // Pattern-based recommendations
    this.generatePatternBasedRecommendations();
    
    // Resource optimization recommendations
    this.generateResourceOptimizationRecommendations();
  }

  /**
   * Generate AI-based recommendations
   */
  private generateAIBasedRecommendations() {
    // Analyze AI model performance and suggest optimizations
    const pipelineStats = this.pipeline.getStats();
    
    if (pipelineStats.averageCompletionTime > 35) { // Above 35 minutes average
      const recommendation: OptimizationRecommendation = {
        id: `ai_model_optimization_${Date.now()}`,
        type: 'ai_model_optimization',
        title: 'AI Model Performance Optimization',
        description: `Average task completion time (${pipelineStats.averageCompletionTime.toFixed(1)} min) is higher than optimal. Consider model optimization.`,
        impact: {
          performance: 30,
          cost: 'low',
          effort: 'medium',
          risk: 'low'
        },
        implementation: {
          steps: [
            'Analyze model response times and accuracy',
            'Implement model result caching',
            'Optimize prompt engineering',
            'Consider using specialized models for specific tasks'
          ],
          estimatedTime: 120,
          requirements: ['AI model access', 'Performance monitoring'],
          rollbackPlan: 'Revert to previous model configuration'
        },
        evidence: {
          metrics: [],
          benchmarks: [],
          confidence: 0.75
        },
        status: 'pending',
        priority: 'medium',
        createdAt: new Date()
      };

      this.recommendations.set(recommendation.id, recommendation);
    }
  }

  /**
   * Generate pattern-based recommendations
   */
  private generatePatternBasedRecommendations() {
    // Analyze usage patterns and suggest optimizations
    const timeOfDay = new Date().getHours();
    
    // Peak hours optimization
    if (timeOfDay >= 9 && timeOfDay <= 17) { // Business hours
      const recommendation: OptimizationRecommendation = {
        id: `peak_hours_optimization_${Date.now()}`,
        type: 'resource_scaling',
        title: 'Peak Hours Resource Optimization',
        description: 'During peak business hours, pre-scale resources to handle increased load.',
        impact: {
          performance: 20,
          cost: 'medium',
          effort: 'low',
          risk: 'low'
        },
        implementation: {
          steps: [
            'Configure time-based auto-scaling rules',
            'Pre-warm agent pools during peak hours',
            'Implement load balancing for API requests'
          ],
          estimatedTime: 45,
          requirements: ['Pro subscription for advanced scheduling'],
          rollbackPlan: 'Disable time-based scaling'
        },
        evidence: {
          metrics: [],
          benchmarks: [],
          confidence: 0.6
        },
        status: 'pending',
        priority: 'low',
        createdAt: new Date()
      };

      // Only add if we don't already have a similar recommendation
      const existingSimilar = Array.from(this.recommendations.values())
        .find(r => r.title.includes('Peak Hours'));
      
      if (!existingSimilar) {
        this.recommendations.set(recommendation.id, recommendation);
      }
    }
  }

  /**
   * Generate resource optimization recommendations
   */
  private generateResourceOptimizationRecommendations() {
    const orchestratorStats = this.orchestrator.getStats();
    
    // Job queue optimization
    if (orchestratorStats.pendingJobs > 5) {
      const recommendation: OptimizationRecommendation = {
        id: `job_queue_optimization_${Date.now()}`,
        type: 'resource_scaling',
        title: 'Job Queue Optimization',
        description: `High number of pending jobs (${orchestratorStats.pendingJobs}). Consider increasing concurrent job capacity.`,
        impact: {
          performance: 35,
          cost: 'medium',
          effort: 'low',
          risk: 'low'
        },
        implementation: {
          steps: [
            'Increase maximum concurrent jobs limit',
            'Implement job priority queuing',
            'Add job execution parallelization',
            'Optimize job dependency resolution'
          ],
          estimatedTime: 60,
          requirements: ['System configuration access'],
          rollbackPlan: 'Reduce concurrent job limits if resource constraints occur'
        },
        evidence: {
          metrics: [],
          benchmarks: [],
          confidence: 0.8
        },
        status: 'pending',
        priority: 'medium',
        createdAt: new Date()
      };

      this.recommendations.set(recommendation.id, recommendation);
    }
  }

  /**
   * Update benchmark values
   */
  private updateBenchmarks() {
    // Benchmarks are updated in compareToBenchmarks method
    console.log('Benchmarks updated based on current performance data');
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts() {
    const recentMetrics = Array.from(this.metrics.values())
      .filter(m => Date.now() - m.timestamp.getTime() < 5 * 60 * 1000); // Last 5 minutes

    for (const metric of recentMetrics) {
      if (metric.threshold) {
        this.checkMetricThresholds(metric);
      }
    }
  }

  /**
   * Check metric against thresholds and create alerts
   */
  private checkMetricThresholds(metric: PerformanceMetric) {
    if (!metric.threshold) return;

    let alertLevel: PerformanceAlert['level'] | null = null;
    let threshold = 0;

    if (metric.value >= metric.threshold.critical) {
      alertLevel = 'critical';
      threshold = metric.threshold.critical;
    } else if (metric.value >= metric.threshold.warning) {
      alertLevel = 'warning';
      threshold = metric.threshold.warning;
    }

    if (alertLevel) {
      // Check if we already have an active alert for this metric type
      const existingAlert = Array.from(this.alerts.values())
        .find(a => 
          a.metricId.includes(metric.metricType) && 
          !a.resolvedAt &&
          Date.now() - a.timestamp.getTime() < 15 * 60 * 1000 // Last 15 minutes
        );

      if (!existingAlert) {
        const alert: PerformanceAlert = {
          id: `alert_${metric.metricType}_${Date.now()}`,
          level: alertLevel,
          title: `High ${metric.metricType.replace('_', ' ').toUpperCase()}`,
          // Fixed: Sanitize user input to prevent format string injection
          message: `${metric.metricType.replace(/[^a-zA-Z0-9_-]/g, '_').replace('_', ' ')} (${metric.value.toFixed(2)} ${metric.unit.replace(/[<>&"']/g, '')}) exceeded ${alertLevel} threshold (${threshold} ${metric.unit.replace(/[<>&"']/g, '')})`,
          metricId: metric.id,
          currentValue: metric.value,
          threshold,
          duration: 0,
          acknowledged: false,
          actions: [],
          timestamp: new Date()
        };

        this.alerts.set(alert.id, alert);
        this.processAlert(alert);
      }
    }
  }

  /**
   * Process a performance alert
   */
  private async processAlert(alert: PerformanceAlert) {
    // Auto-acknowledge low priority alerts
    if (alert.level === 'info') {
      alert.acknowledged = true;
    }

    // Execute automated responses based on alert type
    if (alert.title.includes('CPU') && alert.level === 'critical') {
      await this.executeAlertAction(alert, 'auto_scale', 'Scale up resources due to high CPU usage');
    } else if (alert.title.includes('ERROR_RATE') && alert.level === 'critical') {
      await this.executeAlertAction(alert, 'restart', 'Restart components due to high error rate');
    }

    // Track alert in analytics
    trackFeatureUsage('system', 'performance-optimizer', true, {
      alertLevel: alert.level,
      metricType: alert.title,
      autoAction: alert.actions.length > 0
    });
  }

  /**
   * Execute an alert action
   */
  private async executeAlertAction(
    alert: PerformanceAlert,
    actionType: PerformanceAlert['actions'][0]['type'],
    reason: string
  ) {
    const action = {
      type: actionType,
      executed: false,
      result: undefined as string | undefined
    };

    try {
      switch (actionType) {
        case 'auto_scale':
          // Trigger auto-scaling if enabled
          await this.triggerAutoScale('scale_up', reason);
          action.executed = true;
          action.result = 'Auto-scaling triggered successfully';
          break;

        case 'restart':
          // Restart components (simulated)
          console.log(`Restarting components due to: ${reason}`);
          action.executed = true;
          action.result = 'Components restarted successfully';
          break;

        case 'optimization':
          // Trigger automatic optimization
          await this.triggerAutomaticOptimization(reason);
          action.executed = true;
          action.result = 'Automatic optimization applied';
          break;

        case 'notification':
          // Send notifications (simulated)
          console.log(`Notification sent: ${reason}`);
          action.executed = true;
          action.result = 'Notification sent successfully';
          break;
      }
    } catch (error) {
      action.executed = false;
      action.result = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    alert.actions.push(action);
    this.alerts.set(alert.id, alert);
  }

  /**
   * Execute auto-scaling rules
   */
  private async executeAutoScaling() {
    const currentMetrics = this.getCurrentMetricValues();

    for (const rule of this.scalingRules.values()) {
      if (!rule.enabled) continue;

      // Check if rule conditions are met
      const shouldTrigger = await this.evaluateScalingRule(rule, currentMetrics);
      
      if (shouldTrigger) {
        await this.executeScalingAction(rule);
      }
    }
  }

  /**
   * Evaluate if a scaling rule should be triggered
   */
  private async evaluateScalingRule(
    rule: AutoScalingRule,
    currentMetrics: Record<string, PerformanceMetric[]>
  ): Promise<boolean> {
    const relevantMetrics = this.findMetricsForRule(rule, currentMetrics);
    
    if (relevantMetrics.length === 0) return false;

    const avgValue = relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length;
    
    // Check if trigger condition is met
    const conditionMet = this.evaluateCondition(avgValue, rule.trigger.operator, rule.trigger.threshold);
    
    if (!conditionMet) return false;

    // Check duration requirement
    const triggerDuration = rule.trigger.duration * 1000; // Convert to milliseconds
    const oldestRelevantTime = Date.now() - triggerDuration;
    const sustainedMetrics = relevantMetrics.filter(m => m.timestamp.getTime() >= oldestRelevantTime);
    
    const sustainedCondition = sustainedMetrics.every(m => 
      this.evaluateCondition(m.value, rule.trigger.operator, rule.trigger.threshold)
    );

    return sustainedCondition && sustainedMetrics.length >= 3; // Need at least 3 data points
  }

  /**
   * Find metrics relevant to a scaling rule
   */
  private findMetricsForRule(
    rule: AutoScalingRule,
    currentMetrics: Record<string, PerformanceMetric[]>
  ): PerformanceMetric[] {
    // Map rule metrics to actual metric keys
    const metricMappings: Record<string, string[]> = {
      'agent_utilization': ['throughput_pipeline'],
      'error_rate': ['error_rate_application', 'error_rate_pipeline'],
      'cpu_usage': ['cpu_system'],
      'memory_usage': ['memory_system']
    };

    const relevantKeys = metricMappings[rule.trigger.metric] || [rule.trigger.metric];
    const relevantMetrics: PerformanceMetric[] = [];

    for (const key of relevantKeys) {
      if (currentMetrics[key]) {
        relevantMetrics.push(...currentMetrics[key]);
      }
    }

    return relevantMetrics;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return Math.abs(value - threshold) < 0.01;
      default: return false;
    }
  }

  /**
   * Execute a scaling action
   */
  private async executeScalingAction(rule: AutoScalingRule) {
    try {
      switch (rule.action.type) {
        case 'scale_up':
          await this.triggerAutoScale('scale_up', `Auto-scaling rule: ${rule.name}`);
          break;

        case 'scale_down':
          await this.triggerAutoScale('scale_down', `Auto-scaling rule: ${rule.name}`);
          break;

        case 'restart':
          // Fixed: Sanitize user input to prevent format string injection
          const sanitizedComponent = rule.action.parameters.component?.replace(/[<>&"']/g, '') || 'unknown';
          const sanitizedRuleName = rule.name?.replace(/[<>&"']/g, '') || 'unknown';
          console.log(`Restarting ${sanitizedComponent} due to rule: ${sanitizedRuleName}`);
          break;

        case 'alert':
          console.log(`Alert triggered by rule: ${rule.name}`);
          break;

        case 'optimize':
          await this.triggerAutomaticOptimization(`Auto-optimization rule: ${rule.name}`);
          break;
      }

      // Log successful execution
      console.log(`Executed scaling action for rule: ${rule.name}`);

    } catch (error) {
      console.error(`Failed to execute scaling action for rule ${rule.name}:`, error);
    }
  }

  /**
   * Trigger auto-scaling
   */
  private async triggerAutoScale(direction: 'scale_up' | 'scale_down', reason: string) {
    // Implementation would depend on the actual infrastructure
    // Fixed: Sanitize user input to prevent format string injection
    const sanitizedDirection = direction?.replace(/[<>&"']/g, '') || 'unknown';
    const sanitizedReason = reason?.replace(/[<>&"']/g, '') || 'no reason provided';
    console.log(`Auto-scaling ${sanitizedDirection} triggered: ${sanitizedReason}`);
    
    // Track scaling event
    trackFeatureUsage('system', 'auto-scaling', true, {
      direction,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trigger automatic optimization
   */
  private async triggerAutomaticOptimization(reason: string) {
    console.log(`Automatic optimization triggered: ${reason}`);
    
    // Apply low-risk optimizations automatically
    const lowRiskRecommendations = Array.from(this.recommendations.values())
      .filter(r => r.impact.risk === 'low' && r.status === 'pending');

    for (const recommendation of lowRiskRecommendations.slice(0, 2)) { // Apply max 2 at a time
      await this.applyOptimizationRecommendation(recommendation.id);
    }
  }

  /**
   * Apply an optimization recommendation
   */
  public async applyOptimizationRecommendation(recommendationId: string): Promise<boolean> {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation || recommendation.status !== 'pending') {
      return false;
    }

    recommendation.status = 'implementing';
    recommendation.implementedAt = new Date();
    
    try {
      // Simulate implementation (in real system, this would execute actual optimizations)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate results
      const actualImprovement = recommendation.impact.performance * (0.7 + Math.random() * 0.4); // 70-110% of expected
      
      recommendation.status = 'completed';
      recommendation.results = {
        actualImprovement,
        sideEffects: [],
        success: true
      };

      this.recommendations.set(recommendationId, recommendation);

      // Track optimization applied
      trackFeatureUsage('system', 'optimization-applied', true, {
        type: recommendation.type,
        impact: actualImprovement,
        effort: recommendation.impact.effort
      });

      return true;
    } catch (error) {
      recommendation.status = 'pending'; // Reset to pending for retry
      console.error(`Failed to apply optimization ${recommendationId}:`, error);
      return false;
    }
  }

  /**
   * Get performance metrics
   */
  public getMetrics(timeWindow: number = 60): PerformanceMetric[] {
    const cutoff = Date.now() - timeWindow * 60 * 1000;
    return Array.from(this.metrics.values())
      .filter(m => m.timestamp.getTime() > cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get optimization recommendations
   */
  public getRecommendations(status?: OptimizationRecommendation['status']): OptimizationRecommendation[] {
    const recommendations = Array.from(this.recommendations.values());
    return status ? recommendations.filter(r => r.status === status) : recommendations;
  }

  /**
   * Get performance benchmarks
   */
  public getBenchmarks(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  /**
   * Get performance alerts
   */
  public getAlerts(level?: PerformanceAlert['level']): PerformanceAlert[] {
    const alerts = Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return level ? alerts.filter(a => a.level === level) : alerts;
  }

  /**
   * Get auto-scaling rules
   */
  public getScalingRules(): AutoScalingRule[] {
    return Array.from(this.scalingRules.values());
  }

  /**
   * Get optimizer statistics
   */
  public getOptimizerStats(): {
    totalMetrics: number;
    activeRecommendations: number;
    implementedOptimizations: number;
    activeAlerts: number;
    averagePerformanceImprovement: number;
    systemHealth: 'optimal' | 'good' | 'degraded' | 'critical';
  } {
    const recommendations = Array.from(this.recommendations.values());
    const activeRecommendations = recommendations.filter(r => r.status === 'pending').length;
    const implementedOptimizations = recommendations.filter(r => r.status === 'completed').length;
    
    const alerts = Array.from(this.alerts.values());
    const activeAlerts = alerts.filter(a => !a.resolvedAt).length;

    const completedOptimizations = recommendations.filter(r => r.status === 'completed' && r.results);
    const averagePerformanceImprovement = completedOptimizations.length > 0
      ? completedOptimizations.reduce((sum, r) => sum + (r.results?.actualImprovement || 0), 0) / completedOptimizations.length
      : 0;

    // Determine system health
    let systemHealth: 'optimal' | 'good' | 'degraded' | 'critical' = 'optimal';
    const criticalAlerts = alerts.filter(a => a.level === 'critical' && !a.resolvedAt).length;
    const warningAlerts = alerts.filter(a => a.level === 'warning' && !a.resolvedAt).length;

    if (criticalAlerts > 0) systemHealth = 'critical';
    else if (warningAlerts > 2) systemHealth = 'degraded';
    else if (warningAlerts > 0 || activeRecommendations > 5) systemHealth = 'good';

    return {
      totalMetrics: this.metrics.size,
      activeRecommendations,
      implementedOptimizations,
      activeAlerts,
      averagePerformanceImprovement,
      systemHealth
    };
  }

  /**
   * Shutdown the optimizer
   */
  public shutdown() {
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = undefined;
    }
    
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = undefined;
    }
    
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = undefined;
    }
  }
}
