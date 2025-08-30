import { trackFeatureUsage } from './posthog';

export interface ReactScanMetrics {
  componentName: string;
  renderCount: number;
  renderTime: number;
  wastedRenders: number;
  timestamp: Date;
  props?: any;
  state?: any;
}

export interface PerformanceIssue {
  id: string;
  type: 'excessive_renders' | 'slow_component' | 'memory_leak' | 'prop_drilling';
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  metrics: ReactScanMetrics[];
  detectedAt: Date;
  resolved: boolean;
}

export class ReactScanMonitor {
  private static instance: ReactScanMonitor;
  private metrics: Map<string, ReactScanMetrics[]> = new Map();
  private issues: Map<string, PerformanceIssue> = new Map();
  private isEnabled = false;
  private scanInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeReactScan();
  }

  public static getInstance(): ReactScanMonitor {
    if (!ReactScanMonitor.instance) {
      ReactScanMonitor.instance = new ReactScanMonitor();
    }
    return ReactScanMonitor.instance;
  }

  /**
   * Initialize React Scan monitoring
   */
  private async initializeReactScan() {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return; // Only run in development
    }

    try {
      // Dynamic import to avoid SSR issues
      const { scan } = await import('react-scan');
      
      // Configure React Scan
      scan({
        enabled: true,
        log: false, // We'll handle logging ourselves
        onRender: (fiber: any, renderTime: number) => {
          this.recordRender(fiber, renderTime);
        },
        onCommit: (fiber: any) => {
          this.analyzeCommit(fiber);
        }
      });

      this.isEnabled = true;
      this.startMonitoring();
      
      console.log('🔍 React Scan monitoring enabled');
    } catch (error) {
      console.warn('Failed to initialize React Scan:', error);
    }
  }

  /**
   * Record a component render
   */
  private recordRender(fiber: any, renderTime: number) {
    if (!fiber?.type?.name && !fiber?.type?.displayName) return;

    const componentName = fiber.type.name || fiber.type.displayName || 'Anonymous';
    const currentMetrics = this.metrics.get(componentName) || [];

    const metric: ReactScanMetrics = {
      componentName,
      renderCount: 1,
      renderTime,
      wastedRenders: this.isWastedRender(fiber) ? 1 : 0,
      timestamp: new Date(),
      props: this.sanitizeProps(fiber.memoizedProps),
      state: this.sanitizeState(fiber.memoizedState)
    };

    currentMetrics.push(metric);

    // Keep only last 100 renders per component
    if (currentMetrics.length > 100) {
      currentMetrics.shift();
    }

    this.metrics.set(componentName, currentMetrics);

    // Check for performance issues
    this.checkForIssues(componentName, currentMetrics);
  }

  /**
   * Analyze a commit phase
   */
  private analyzeCommit(fiber: any) {
    // Analyze the entire fiber tree for patterns
    this.traverseFiber(fiber, (node) => {
      if (node.type?.name || node.type?.displayName) {
        const componentName = node.type.name || node.type.displayName;
        this.checkComponentHealth(componentName, node);
      }
    });
  }

  /**
   * Check if a render was wasted (props/state didn't change)
   */
  private isWastedRender(fiber: any): boolean {
    if (!fiber.alternate) return false; // First render

    const prevProps = fiber.alternate.memoizedProps;
    const currentProps = fiber.memoizedProps;
    const prevState = fiber.alternate.memoizedState;
    const currentState = fiber.memoizedState;

    // Shallow comparison (React Scan provides deeper analysis)
    return this.shallowEqual(prevProps, currentProps) && 
           this.shallowEqual(prevState, currentState);
  }

  /**
   * Shallow equality check
   */
  private shallowEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }

    return true;
  }

  /**
   * Sanitize props for storage (remove functions, etc.)
   */
  private sanitizeProps(props: any): any {
    if (!props || typeof props !== 'object') return props;

    const sanitized: any = {};
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = '[Object]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Sanitize state for storage
   */
  private sanitizeState(state: any): any {
    if (!state) return null;
    if (typeof state !== 'object') return state;

    try {
      return JSON.parse(JSON.stringify(state, (key, value) => {
        if (typeof value === 'function') return '[Function]';
        if (typeof value === 'object' && value !== null && Object.keys(value).length > 10) {
          return '[Large Object]';
        }
        return value;
      }));
    } catch {
      return '[Complex State]';
    }
  }

  /**
   * Traverse fiber tree
   */
  private traverseFiber(fiber: any, callback: (fiber: any) => void) {
    if (!fiber) return;

    callback(fiber);

    if (fiber.child) {
      this.traverseFiber(fiber.child, callback);
    }
    if (fiber.sibling) {
      this.traverseFiber(fiber.sibling, callback);
    }
  }

  /**
   * Check component health
   */
  private checkComponentHealth(componentName: string, fiber: any) {
    const metrics = this.metrics.get(componentName) || [];
    if (metrics.length < 5) return; // Need some data

    const recent = metrics.slice(-10); // Last 10 renders
    const avgRenderTime = recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length;
    const wastedRenderCount = recent.reduce((sum, m) => sum + m.wastedRenders, 0);

    // Check for slow components
    if (avgRenderTime > 16) { // 16ms = 60fps threshold
      this.createIssue({
        type: 'slow_component',
        component: componentName,
        severity: avgRenderTime > 50 ? 'critical' : avgRenderTime > 30 ? 'high' : 'medium',
        description: `Component ${componentName} has slow render times (avg: ${avgRenderTime.toFixed(2)}ms)`,
        suggestion: 'Consider memoization, code splitting, or optimizing heavy computations',
        metrics: recent
      });
    }

    // Check for excessive re-renders
    if (wastedRenderCount > 5) {
      this.createIssue({
        type: 'excessive_renders',
        component: componentName,
        severity: wastedRenderCount > 8 ? 'high' : 'medium',
        description: `Component ${componentName} has ${wastedRenderCount} wasted renders in last 10 renders`,
        suggestion: 'Use React.memo, useMemo, or useCallback to prevent unnecessary re-renders',
        metrics: recent
      });
    }
  }

  /**
   * Check for performance issues
   */
  private checkForIssues(componentName: string, metrics: ReactScanMetrics[]) {
    if (metrics.length < 10) return; // Need sufficient data

    const recent = metrics.slice(-10);
    const renderTimes = recent.map(m => m.renderTime);
    const wastedRenders = recent.reduce((sum, m) => sum + m.wastedRenders, 0);

    // Detect performance patterns
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);

    // Issue detection
    if (avgRenderTime > 20) {
      this.createIssue({
        type: 'slow_component',
        component: componentName,
        severity: avgRenderTime > 50 ? 'critical' : 'high',
        description: `Slow rendering detected: ${avgRenderTime.toFixed(2)}ms average`,
        suggestion: 'Consider optimizing render logic or using React.memo',
        metrics: recent
      });
    }

    if (wastedRenders > 6) {
      this.createIssue({
        type: 'excessive_renders',
        component: componentName,
        severity: wastedRenders > 8 ? 'high' : 'medium',
        description: `${wastedRenders} unnecessary re-renders detected`,
        suggestion: 'Check prop changes and consider memoization',
        metrics: recent
      });
    }
  }

  /**
   * Create a performance issue
   */
  private createIssue(issueData: Omit<PerformanceIssue, 'id' | 'detectedAt' | 'resolved'>) {
    const issueId = `${issueData.component}_${issueData.type}_${Date.now()}`;
    
    // Don't create duplicate issues for the same component+type
    const existingIssue = Array.from(this.issues.values())
      .find(issue => 
        issue.component === issueData.component && 
        issue.type === issueData.type && 
        !issue.resolved &&
        Date.now() - issue.detectedAt.getTime() < 60000 // Within last minute
      );

    if (existingIssue) return;

    const issue: PerformanceIssue = {
      ...issueData,
      id: issueId,
      detectedAt: new Date(),
      resolved: false
    };

    this.issues.set(issueId, issue);

    // Track issue detection
    trackFeatureUsage('system', 'react-scan-issue-detected', true, {
      issueType: issue.type,
      component: issue.component,
      severity: issue.severity
    });

    console.warn(`🚨 React Performance Issue: ${issue.description}`);
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring() {
    this.scanInterval = setInterval(() => {
      this.analyzePerformancePatterns();
      this.cleanupOldData();
    }, 30000); // Every 30 seconds
  }

  /**
   * Analyze performance patterns across components
   */
  private analyzePerformancePatterns() {
    const componentStats = new Map<string, {
      totalRenders: number;
      totalTime: number;
      wastedRenders: number;
      lastActivity: Date;
    }>();

    // Aggregate stats
    for (const [componentName, metrics] of this.metrics.entries()) {
      const recent = metrics.filter(m => Date.now() - m.timestamp.getTime() < 60000); // Last minute
      
      if (recent.length === 0) continue;

      componentStats.set(componentName, {
        totalRenders: recent.length,
        totalTime: recent.reduce((sum, m) => sum + m.renderTime, 0),
        wastedRenders: recent.reduce((sum, m) => sum + m.wastedRenders, 0),
        lastActivity: recent[recent.length - 1].timestamp
      });
    }

    // Find problematic patterns
    for (const [componentName, stats] of componentStats.entries()) {
      const avgRenderTime = stats.totalTime / stats.totalRenders;
      const wastedRatio = stats.wastedRenders / stats.totalRenders;

      // High render frequency might indicate issues
      if (stats.totalRenders > 20) { // More than 20 renders per minute
        this.createIssue({
          type: 'excessive_renders',
          component: componentName,
          severity: stats.totalRenders > 40 ? 'critical' : 'high',
          description: `High render frequency: ${stats.totalRenders} renders/minute`,
          suggestion: 'Investigate what\'s causing frequent re-renders',
          metrics: this.metrics.get(componentName)?.slice(-10) || []
        });
      }

      // High wasted render ratio
      if (wastedRatio > 0.5 && stats.totalRenders > 5) {
        this.createIssue({
          type: 'excessive_renders',
          component: componentName,
          severity: 'medium',
          description: `${Math.round(wastedRatio * 100)}% of renders are unnecessary`,
          suggestion: 'Add memoization or check prop/state dependencies',
          metrics: this.metrics.get(componentName)?.slice(-10) || []
        });
      }
    }
  }

  /**
   * Clean up old data
   */
  private cleanupOldData() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Clean old metrics
    for (const [componentName, metrics] of this.metrics.entries()) {
      const recentMetrics = metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
      if (recentMetrics.length === 0) {
        this.metrics.delete(componentName);
      } else {
        this.metrics.set(componentName, recentMetrics);
      }
    }

    // Clean old resolved issues
    for (const [issueId, issue] of this.issues.entries()) {
      if (issue.resolved && issue.detectedAt.getTime() < oneHourAgo) {
        this.issues.delete(issueId);
      }
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(componentName?: string): ReactScanMetrics[] {
    if (componentName) {
      return this.metrics.get(componentName) || [];
    }

    const allMetrics: ReactScanMetrics[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }

    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get performance issues
   */
  public getIssues(resolved?: boolean): PerformanceIssue[] {
    const issues = Array.from(this.issues.values());
    
    if (resolved !== undefined) {
      return issues.filter(issue => issue.resolved === resolved);
    }

    return issues.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  /**
   * Resolve an issue
   */
  public resolveIssue(issueId: string): boolean {
    const issue = this.issues.get(issueId);
    if (!issue) return false;

    issue.resolved = true;
    this.issues.set(issueId, issue);

    trackFeatureUsage('system', 'react-scan-issue-resolved', true, {
      issueType: issue.type,
      component: issue.component,
      severity: issue.severity
    });

    return true;
  }

  /**
   * Get component performance summary
   */
  public getComponentSummary(): Array<{
    component: string;
    renderCount: number;
    avgRenderTime: number;
    wastedRenders: number;
    issues: number;
    lastRender: Date;
  }> {
    const summary: Array<{
      component: string;
      renderCount: number;
      avgRenderTime: number;
      wastedRenders: number;
      issues: number;
      lastRender: Date;
    }> = [];

    for (const [componentName, metrics] of this.metrics.entries()) {
      const recent = metrics.filter(m => Date.now() - m.timestamp.getTime() < 300000); // Last 5 minutes
      
      if (recent.length === 0) continue;

      const totalRenderTime = recent.reduce((sum, m) => sum + m.renderTime, 0);
      const totalWastedRenders = recent.reduce((sum, m) => sum + m.wastedRenders, 0);
      const componentIssues = Array.from(this.issues.values())
        .filter(issue => issue.component === componentName && !issue.resolved).length;

      summary.push({
        component: componentName,
        renderCount: recent.length,
        avgRenderTime: totalRenderTime / recent.length,
        wastedRenders: totalWastedRenders,
        issues: componentIssues,
        lastRender: recent[recent.length - 1].timestamp
      });
    }

    return summary.sort((a, b) => b.renderCount - a.renderCount);
  }

  /**
   * Get system performance stats
   */
  public getSystemStats(): {
    totalComponents: number;
    totalRenders: number;
    totalIssues: number;
    criticalIssues: number;
    avgRenderTime: number;
    isEnabled: boolean;
  } {
    const allMetrics = this.getMetrics();
    const recentMetrics = allMetrics.filter(m => Date.now() - m.timestamp.getTime() < 300000); // Last 5 minutes
    const issues = this.getIssues(false);

    return {
      totalComponents: this.metrics.size,
      totalRenders: recentMetrics.length,
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      avgRenderTime: recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length 
        : 0,
      isEnabled: this.isEnabled
    };
  }

  /**
   * Enable/disable monitoring
   */
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    
    if (enabled && !this.scanInterval) {
      this.startMonitoring();
    } else if (!enabled && this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = undefined;
    }
  }

  /**
   * Shutdown monitoring
   */
  public shutdown() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = undefined;
    }
    this.isEnabled = false;
  }
}
