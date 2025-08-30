import { AutonomousPipeline, AutonomousTask, AutonomousAgent } from './autonomous-pipeline';
import { BackgroundOrchestrator, BackgroundJob } from './background-orchestrator';
import { GitHubAutomation, PullRequest } from './github-automation';

export interface SystemMetrics {
  timestamp: Date;
  pipeline: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    agentUtilization: number;
    averageTaskTime: number;
  };
  orchestrator: {
    totalJobs: number;
    runningJobs: number;
    completedJobs: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    agentCoordinations: number;
  };
  github: {
    totalPRs: number;
    openPRs: number;
    mergedPRs: number;
    automationRate: number;
  };
  performance: {
    cpuUsage?: number;
    memoryUsage?: number;
    responseTime: number;
  };
}

export interface ProgressUpdate {
  id: string;
  type: 'task' | 'job' | 'pr' | 'system';
  entityId: string;
  status: string;
  progress: number; // 0-100
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AlertConfig {
  type: 'task_failure' | 'job_timeout' | 'system_health' | 'pr_failure';
  threshold: number;
  enabled: boolean;
  subscriptionLevel: 'free' | 'pro' | 'enterprise';
  notificationMethods: ('email' | 'webhook' | 'dashboard')[];
}

export interface MonitoringSubscription {
  userId: string;
  subscriptionType: 'free' | 'pro' | 'enterprise';
  channels: string[]; // WebSocket connection IDs
  filters: {
    taskTypes?: string[];
    priorities?: string[];
    agents?: string[];
  };
  realTimeEnabled: boolean;
}

export class RealtimeMonitor {
  private static instance: RealtimeMonitor;
  private pipeline: AutonomousPipeline;
  private orchestrator: BackgroundOrchestrator;
  private github: GitHubAutomation;
  
  private metrics: SystemMetrics[] = [];
  private progressUpdates: ProgressUpdate[] = [];
  private alerts: AlertConfig[] = [];
  private subscriptions: Map<string, MonitoringSubscription> = new Map();
  
  private monitoringInterval?: NodeJS.Timeout;
  private metricsRetentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
  private updateListeners: ((update: ProgressUpdate) => void)[] = [];

  constructor() {
    this.pipeline = AutonomousPipeline.getInstance();
    this.orchestrator = BackgroundOrchestrator.getInstance();
    this.github = GitHubAutomation.getInstance();
    
    this.initializeAlerts();
    this.startMonitoring();
  }

  public static getInstance(): RealtimeMonitor {
    if (!RealtimeMonitor.instance) {
      RealtimeMonitor.instance = new RealtimeMonitor();
    }
    return RealtimeMonitor.instance;
  }

  /**
   * Initialize default alert configurations
   */
  private initializeAlerts() {
    const defaultAlerts: AlertConfig[] = [
      {
        type: 'task_failure',
        threshold: 3, // 3 consecutive failures
        enabled: true,
        subscriptionLevel: 'free',
        notificationMethods: ['dashboard']
      },
      {
        type: 'job_timeout',
        threshold: 120, // 2 hours
        enabled: true,
        subscriptionLevel: 'pro',
        notificationMethods: ['dashboard', 'email']
      },
      {
        type: 'system_health',
        threshold: 0.8, // 80% failure rate
        enabled: true,
        subscriptionLevel: 'pro',
        notificationMethods: ['dashboard', 'webhook']
      },
      {
        type: 'pr_failure',
        threshold: 2, // 2 failed PRs
        enabled: true,
        subscriptionLevel: 'enterprise',
        notificationMethods: ['dashboard', 'email', 'webhook']
      }
    ];

    this.alerts = defaultAlerts;
  }

  /**
   * Start monitoring system metrics
   */
  private startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.cleanupOldData();
      this.checkAlerts();
    }, 30000); // Collect metrics every 30 seconds
  }

  /**
   * Collect current system metrics
   */
  private async collectMetrics() {
    const startTime = Date.now();
    
    try {
      const pipelineStats = this.pipeline.getStats();
      const orchestratorStats = this.orchestrator.getStats();
      const githubStats = this.github.getStats();

      const metrics: SystemMetrics = {
        timestamp: new Date(),
        pipeline: {
          totalTasks: pipelineStats.totalTasks,
          activeTasks: pipelineStats.runningTasks,
          completedTasks: pipelineStats.completedTasks,
          failedTasks: pipelineStats.failedTasks,
          agentUtilization: pipelineStats.agentUtilization,
          averageTaskTime: pipelineStats.averageCompletionTime
        },
        orchestrator: {
          totalJobs: orchestratorStats.totalJobs,
          runningJobs: orchestratorStats.runningJobs,
          completedJobs: orchestratorStats.completedJobs,
          systemHealth: orchestratorStats.systemHealth,
          agentCoordinations: orchestratorStats.agentCoordinations
        },
        github: {
          totalPRs: githubStats.totalPRs,
          openPRs: githubStats.openPRs,
          mergedPRs: githubStats.mergedPRs,
          automationRate: githubStats.automationRate
        },
        performance: {
          responseTime: Date.now() - startTime
        }
      };

      this.metrics.push(metrics);

      // Emit system update
      this.emitProgressUpdate({
        id: `system_${Date.now()}`,
        type: 'system',
        entityId: 'system',
        status: orchestratorStats.systemHealth,
        progress: this.calculateSystemProgress(metrics),
        message: `System health: ${orchestratorStats.systemHealth}`,
        timestamp: new Date(),
        metadata: { metrics }
      });

    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Calculate overall system progress
   */
  private calculateSystemProgress(metrics: SystemMetrics): number {
    const { pipeline, orchestrator } = metrics;
    
    // Calculate based on active tasks vs total capacity
    const taskProgress = pipeline.totalTasks > 0 
      ? (pipeline.completedTasks / pipeline.totalTasks) * 100 
      : 100;
      
    const jobProgress = orchestrator.totalJobs > 0
      ? (orchestrator.completedJobs / orchestrator.totalJobs) * 100
      : 100;
      
    return Math.round((taskProgress + jobProgress) / 2);
  }

  /**
   * Subscribe to real-time updates
   */
  public subscribe(subscription: MonitoringSubscription): boolean {
    // Free tier: limited monitoring
    if (subscription.subscriptionType === 'free') {
      subscription.realTimeEnabled = false;
    }

    this.subscriptions.set(subscription.userId, subscription);
    return true;
  }

  /**
   * Unsubscribe from updates
   */
  public unsubscribe(userId: string): boolean {
    return this.subscriptions.delete(userId);
  }

  /**
   * Add progress update listener
   */
  public addUpdateListener(listener: (update: ProgressUpdate) => void) {
    this.updateListeners.push(listener);
  }

  /**
   * Remove progress update listener
   */
  public removeUpdateListener(listener: (update: ProgressUpdate) => void) {
    const index = this.updateListeners.indexOf(listener);
    if (index > -1) {
      this.updateListeners.splice(index, 1);
    }
  }

  /**
   * Emit progress update to subscribers
   */
  private emitProgressUpdate(update: ProgressUpdate) {
    this.progressUpdates.push(update);

    // Notify listeners
    this.updateListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in update listener:', error);
      }
    });

    // Send to subscribed users
    this.subscriptions.forEach((subscription, userId) => {
      if (!subscription.realTimeEnabled) return;

      const shouldNotify = this.shouldNotifyUser(update, subscription);
      if (shouldNotify) {
        // In a real implementation, send via WebSocket
        console.log(`Sending update to user ${userId}:`, update);
      }
    });
  }

  /**
   * Check if user should be notified of an update
   */
  private shouldNotifyUser(update: ProgressUpdate, subscription: MonitoringSubscription): boolean {
    const { filters } = subscription;

    // Filter by task type
    if (filters.taskTypes && update.type === 'task') {
      const task = this.pipeline.getTask(update.entityId);
      if (task && !filters.taskTypes.includes(task.type)) {
        return false;
      }
    }

    // Filter by priority
    if (filters.priorities && update.type === 'task') {
      const task = this.pipeline.getTask(update.entityId);
      if (task && !filters.priorities.includes(task.priority)) {
        return false;
      }
    }

    // Filter by agent
    if (filters.agents && update.type === 'task') {
      const task = this.pipeline.getTask(update.entityId);
      if (task && task.assignedAgent && !filters.agents.includes(task.assignedAgent)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Track task progress
   */
  public trackTaskProgress(task: AutonomousTask) {
    const update: ProgressUpdate = {
      id: `task_${task.id}_${Date.now()}`,
      type: 'task',
      entityId: task.id,
      status: task.status,
      progress: task.progress,
      message: `Task "${task.title}" is ${task.status}`,
      timestamp: new Date(),
      metadata: {
        taskType: task.type,
        priority: task.priority,
        assignedAgent: task.assignedAgent
      }
    };

    this.emitProgressUpdate(update);
  }

  /**
   * Track job progress
   */
  public trackJobProgress(job: BackgroundJob) {
    const update: ProgressUpdate = {
      id: `job_${job.id}_${Date.now()}`,
      type: 'job',
      entityId: job.id,
      status: job.status,
      progress: this.calculateJobProgress(job),
      message: `Job "${job.name}" is ${job.status}`,
      timestamp: new Date(),
      metadata: {
        jobType: job.type,
        priority: job.priority,
        taskCount: job.tasks.length
      }
    };

    this.emitProgressUpdate(update);
  }

  /**
   * Calculate job progress based on constituent tasks
   */
  private calculateJobProgress(job: BackgroundJob): number {
    if (job.tasks.length === 0) return 0;

    let totalProgress = 0;
    for (const taskId of job.tasks) {
      const task = this.pipeline.getTask(taskId);
      if (task) {
        totalProgress += task.progress;
      }
    }

    return Math.round(totalProgress / job.tasks.length);
  }

  /**
   * Track PR progress
   */
  public trackPRProgress(pr: PullRequest) {
    let progress = 0;
    switch (pr.status) {
      case 'draft': progress = 25; break;
      case 'open': progress = 50; break;
      case 'merged': progress = 100; break;
      case 'closed': progress = 0; break;
    }

    const update: ProgressUpdate = {
      id: `pr_${pr.id}_${Date.now()}`,
      type: 'pr',
      entityId: pr.id,
      status: pr.status,
      progress,
      message: `PR #${pr.number} "${pr.title}" is ${pr.status}`,
      timestamp: new Date(),
      metadata: {
        prNumber: pr.number,
        branch: pr.branch,
        author: pr.author,
        checks: pr.checks
      }
    };

    this.emitProgressUpdate(update);
  }

  /**
   * Check alerts and trigger notifications
   */
  private checkAlerts() {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) return;

    this.alerts.forEach(alert => {
      if (!alert.enabled) return;

      let shouldTrigger = false;
      let alertMessage = '';

      switch (alert.type) {
        case 'task_failure':
          const recentFailures = this.getRecentTaskFailures();
          if (recentFailures >= alert.threshold) {
            shouldTrigger = true;
            alertMessage = `${recentFailures} consecutive task failures detected`;
          }
          break;

        case 'system_health':
          if (currentMetrics.orchestrator.systemHealth === 'critical') {
            shouldTrigger = true;
            alertMessage = 'System health is critical';
          }
          break;

        case 'job_timeout':
          const timeoutJobs = this.getTimeoutJobs(alert.threshold);
          if (timeoutJobs.length > 0) {
            shouldTrigger = true;
            alertMessage = `${timeoutJobs.length} jobs have timed out`;
          }
          break;
      }

      if (shouldTrigger) {
        this.triggerAlert(alert, alertMessage);
      }
    });
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: AlertConfig, message: string) {
    console.warn(`ALERT [${alert.type}]: ${message}`);

    // In a real implementation, send notifications via configured methods
    alert.notificationMethods.forEach(method => {
      switch (method) {
        case 'dashboard':
          this.emitProgressUpdate({
            id: `alert_${Date.now()}`,
            type: 'system',
            entityId: 'alert',
            status: 'alert',
            progress: 0,
            message: `⚠️ ${message}`,
            timestamp: new Date(),
            metadata: { alertType: alert.type, severity: 'warning' }
          });
          break;
        case 'email':
          console.log(`Would send email alert: ${message}`);
          break;
        case 'webhook':
          console.log(`Would send webhook alert: ${message}`);
          break;
      }
    });
  }

  /**
   * Get recent task failures
   */
  private getRecentTaskFailures(): number {
    const recentTasks = this.pipeline.getTasks({ status: 'failed' })
      .filter(task => {
        const hourAgo = Date.now() - 60 * 60 * 1000;
        return task.createdAt.getTime() > hourAgo;
      });
    
    return recentTasks.length;
  }

  /**
   * Get jobs that have timed out
   */
  private getTimeoutJobs(timeoutMinutes: number): BackgroundJob[] {
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const now = Date.now();

    return this.orchestrator.getJobs({ status: 'running' })
      .filter(job => {
        if (!job.lastRun) return false;
        const runTime = now - job.lastRun.getTime();
        return runTime > timeoutMs;
      });
  }

  /**
   * Get current metrics
   */
  public getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get historical metrics
   */
  public getHistoricalMetrics(hours: number = 24): SystemMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  /**
   * Get recent progress updates
   */
  public getRecentUpdates(limit: number = 50, type?: ProgressUpdate['type']): ProgressUpdate[] {
    let updates = this.progressUpdates;
    
    if (type) {
      updates = updates.filter(u => u.type === type);
    }

    return updates
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clean up old data
   */
  private cleanupOldData() {
    const cutoff = Date.now() - this.metricsRetentionPeriod;

    // Clean metrics
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);

    // Clean progress updates
    this.progressUpdates = this.progressUpdates.filter(u => u.timestamp.getTime() > cutoff);
  }

  /**
   * Get monitoring dashboard data
   */
  public getDashboardData(): {
    currentMetrics: SystemMetrics | null;
    recentUpdates: ProgressUpdate[];
    activeAlerts: number;
    systemStatus: 'healthy' | 'warning' | 'critical';
    trends: {
      taskCompletionRate: number;
      averageJobTime: number;
      prMergeRate: number;
    };
  } {
    const currentMetrics = this.getCurrentMetrics();
    const recentUpdates = this.getRecentUpdates(20);
    const historicalMetrics = this.getHistoricalMetrics(24);

    // Calculate trends
    let taskCompletionRate = 0;
    let averageJobTime = 0;
    let prMergeRate = 0;

    if (historicalMetrics.length > 1) {
      const latest = historicalMetrics[historicalMetrics.length - 1];
      const previous = historicalMetrics[historicalMetrics.length - 2];

      taskCompletionRate = latest.pipeline.completedTasks - previous.pipeline.completedTasks;
      prMergeRate = latest.github.mergedPRs - previous.github.mergedPRs;
    }

    if (currentMetrics) {
      averageJobTime = currentMetrics.orchestrator.runningJobs * 30; // Estimate
    }

    return {
      currentMetrics,
      recentUpdates,
      activeAlerts: this.alerts.filter(a => a.enabled).length,
      systemStatus: currentMetrics?.orchestrator.systemHealth || 'healthy',
      trends: {
        taskCompletionRate,
        averageJobTime,
        prMergeRate
      }
    };
  }

  /**
   * Shutdown monitoring
   */
  public shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.updateListeners.length = 0;
    this.subscriptions.clear();
  }
}
