import { AutonomousPipeline, AutonomousTask, AutonomousAgent } from './autonomous-pipeline';
import { trackAIAgentUsage } from './posthog';

export interface BackgroundJob {
  id: string;
  type: 'scheduled' | 'triggered' | 'manual';
  name: string;
  description: string;
  schedule?: string; // cron expression for scheduled jobs
  trigger?: {
    event: string;
    conditions: Record<string, any>;
  };
  tasks: string[]; // Task IDs to execute
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successCount: number;
  metadata?: {
    userId?: string;
    subscriptionType?: 'free' | 'pro' | 'enterprise';
    maxRetries?: number;
    timeout?: number; // minutes
  };
}

export interface OrchestratorConfig {
  maxConcurrentJobs: number;
  maxBackgroundAgents: number;
  jobTimeout: number; // minutes
  healthCheckInterval: number; // seconds
  retryFailedJobs: boolean;
  notificationWebhook?: string;
  proFeaturesEnabled: boolean;
}

export interface AgentCoordination {
  jobId: string;
  agentId: string;
  taskId: string;
  startTime: Date;
  status: 'assigned' | 'running' | 'completed' | 'failed';
  dependencies: string[]; // other coordination IDs this depends on
  estimatedCompletion: Date;
  actualCompletion?: Date;
  results?: any;
}

export class BackgroundOrchestrator {
  private static instance: BackgroundOrchestrator;
  private pipeline: AutonomousPipeline;
  private jobs: Map<string, BackgroundJob> = new Map();
  private coordinations: Map<string, AgentCoordination> = new Map();
  private config: OrchestratorConfig;
  private schedulerInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.pipeline = AutonomousPipeline.getInstance();
    this.config = {
      maxConcurrentJobs: 3,
      maxBackgroundAgents: 8,
      jobTimeout: 60,
      healthCheckInterval: 30,
      retryFailedJobs: true,
      proFeaturesEnabled: true
    };
    
    this.startScheduler();
    this.startHealthCheck();
  }

  public static getInstance(): BackgroundOrchestrator {
    if (!BackgroundOrchestrator.instance) {
      BackgroundOrchestrator.instance = new BackgroundOrchestrator();
    }
    return BackgroundOrchestrator.instance;
  }

  /**
   * Schedule a background job
   */
  public async scheduleJob(jobData: Omit<BackgroundJob, 'id' | 'status' | 'createdAt' | 'runCount' | 'successCount'>): Promise<string> {
    const job: BackgroundJob = {
      ...jobData,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
      runCount: 0,
      successCount: 0
    };

    // Calculate next run time for scheduled jobs
    if (job.type === 'scheduled' && job.schedule) {
      job.nextRun = this.calculateNextRun(job.schedule);
    }

    this.jobs.set(job.id, job);

    // Track job creation
    if (job.metadata?.userId && job.metadata?.subscriptionType) {
      trackAIAgentUsage(job.metadata.userId, 'background-orchestrator', 'job-scheduled');
    }

    return job.id;
  }

  /**
   * Create a parallel development job (Pro feature)
   */
  public async createParallelDevelopmentJob(
    features: string[],
    userId: string,
    subscriptionType: 'free' | 'pro' | 'enterprise'
  ): Promise<string> {
    if (subscriptionType === 'free' && features.length > 2) {
      throw new Error('Free tier limited to 2 parallel features. Upgrade to Pro for unlimited parallel development.');
    }

    // Create tasks for each feature
    const taskIds: string[] = [];
    for (const feature of features) {
      const taskId = await this.pipeline.submitTask({
        type: 'feature-development',
        title: feature,
        description: `Develop ${feature} feature with full implementation`,
        priority: 'medium',
        estimatedTime: 30,
        metadata: {
          userQuery: `Implement ${feature}`,
          subscriptionType
        }
      });
      taskIds.push(taskId);
    }

    // Create background job for coordination
    const jobId = await this.scheduleJob({
      type: 'manual',
      name: 'Parallel Feature Development',
      description: `Developing ${features.length} features in parallel: ${features.join(', ')}`,
      tasks: taskIds,
      priority: 'high',
      metadata: {
        userId,
        subscriptionType,
        maxRetries: 2,
        timeout: 120
      }
    });

    return jobId;
  }

  /**
   * Start a background job immediately
   */
  public async startJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'running') {
      return false; // Already running
    }

    // Check concurrent job limits
    const runningJobs = Array.from(this.jobs.values()).filter(j => j.status === 'running');
    if (runningJobs.length >= this.config.maxConcurrentJobs) {
      throw new Error('Maximum concurrent jobs limit reached');
    }

    try {
      await this.executeJob(job);
      return true;
    } catch (error) {
      console.error(`Failed to start job ${jobId}:`, error);
      job.status = 'failed';
      this.jobs.set(jobId, job);
      return false;
    }
  }

  /**
   * Execute a background job
   */
  private async executeJob(job: BackgroundJob) {
    job.status = 'running';
    job.lastRun = new Date();
    job.runCount++;
    this.jobs.set(job.id, job);

    try {
      // Create coordination entries for each task
      const coordinations: AgentCoordination[] = [];
      for (const taskId of job.tasks) {
        const coordination: AgentCoordination = {
          jobId: job.id,
          agentId: '', // Will be assigned when task starts
          taskId,
          startTime: new Date(),
          status: 'assigned',
          dependencies: [],
          estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes default
        };
        
        const coordId = `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.coordinations.set(coordId, coordination);
        coordinations.push(coordination);
      }

      // Monitor job execution
      await this.monitorJobExecution(job, coordinations);

    } catch (error) {
      console.error(`Job ${job.id} execution failed:`, error);
      job.status = 'failed';
      this.jobs.set(job.id, job);
      
      // Retry if configured
      if (this.config.retryFailedJobs && job.metadata?.maxRetries && job.runCount <= job.metadata.maxRetries) {
        setTimeout(() => {
          job.status = 'pending';
          this.jobs.set(job.id, job);
        }, 60000); // Retry after 1 minute
      }
    }
  }

  /**
   * Monitor job execution and coordinate agents
   */
  private async monitorJobExecution(job: BackgroundJob, coordinations: AgentCoordination[]) {
    const startTime = Date.now();
    const timeout = (job.metadata?.timeout || this.config.jobTimeout) * 60 * 1000;

    while (job.status === 'running') {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`Job ${job.id} timed out after ${job.metadata?.timeout || this.config.jobTimeout} minutes`);
      }

      // Check task statuses
      let allCompleted = true;
      let anyFailed = false;

      for (const coordination of coordinations) {
        const task = this.pipeline.getTask(coordination.taskId);
        if (!task) continue;

        // Update coordination based on task status
        if (task.status === 'completed' && coordination.status !== 'completed') {
          coordination.status = 'completed';
          coordination.actualCompletion = new Date();
          this.coordinations.set(this.getCoordinationId(coordination), coordination);
        } else if (task.status === 'failed') {
          coordination.status = 'failed';
          anyFailed = true;
        } else if (['analyzing', 'implementing', 'testing'].includes(task.status)) {
          coordination.status = 'running';
          allCompleted = false;
        } else if (task.status === 'pending') {
          allCompleted = false;
        }

        // Update agent assignment
        if (task.assignedAgent && !coordination.agentId) {
          coordination.agentId = task.assignedAgent;
          this.coordinations.set(this.getCoordinationId(coordination), coordination);
        }
      }

      // Check completion
      if (allCompleted) {
        job.status = 'completed';
        job.successCount++;
        this.jobs.set(job.id, job);
        
        // Track successful completion
        if (job.metadata?.userId) {
          trackAIAgentUsage(job.metadata.userId, 'background-orchestrator', 'job-completed');
        }
        break;
      }

      if (anyFailed) {
        throw new Error(`One or more tasks in job ${job.id} failed`);
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  /**
   * Get coordination ID for a coordination object
   */
  private getCoordinationId(coordination: AgentCoordination): string {
    return Array.from(this.coordinations.entries())
      .find(([_, c]) => c.jobId === coordination.jobId && c.taskId === coordination.taskId)?.[0] || '';
  }

  /**
   * Start the job scheduler
   */
  private startScheduler() {
    this.schedulerInterval = setInterval(() => {
      this.checkScheduledJobs();
    }, 60000); // Check every minute
  }

  /**
   * Check for scheduled jobs that need to run
   */
  private async checkScheduledJobs() {
    const now = new Date();
    const scheduledJobs = Array.from(this.jobs.values())
      .filter(job => 
        job.type === 'scheduled' && 
        job.status === 'pending' && 
        job.nextRun && 
        job.nextRun <= now
      );

    for (const job of scheduledJobs) {
      try {
        await this.startJob(job.id);
        
        // Calculate next run
        if (job.schedule) {
          job.nextRun = this.calculateNextRun(job.schedule);
          job.status = 'pending'; // Reset for next run
          this.jobs.set(job.id, job);
        }
      } catch (error) {
        console.error(`Failed to start scheduled job ${job.id}:`, error);
      }
    }
  }

  /**
   * Calculate next run time from cron expression (simplified)
   */
  private calculateNextRun(schedule: string): Date {
    // Simplified cron parsing - in production use a proper cron library
    const now = new Date();
    
    // Handle some common patterns
    if (schedule === '0 */1 * * *') { // Every hour
      return new Date(now.getTime() + 60 * 60 * 1000);
    } else if (schedule === '0 0 * * *') { // Daily at midnight
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    } else if (schedule === '0 0 * * 1') { // Weekly on Monday
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + (8 - now.getDay()) % 7);
      nextMonday.setHours(0, 0, 0, 0);
      return nextMonday;
    }
    
    // Default: 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  /**
   * Start health checking
   */
  private startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval * 1000);
  }

  /**
   * Perform system health check
   */
  private performHealthCheck() {
    const runningJobs = Array.from(this.jobs.values()).filter(j => j.status === 'running');
    const agents = this.pipeline.getAgents();
    const runningAgents = agents.filter(a => a.status === 'busy');

    // Check for stuck jobs
    runningJobs.forEach(job => {
      const runTime = job.lastRun ? Date.now() - job.lastRun.getTime() : 0;
      const timeout = (job.metadata?.timeout || this.config.jobTimeout) * 60 * 1000;
      
      if (runTime > timeout) {
        console.warn(`Job ${job.id} appears stuck (running for ${runTime/1000/60} minutes)`);
        job.status = 'failed';
        this.jobs.set(job.id, job);
      }
    });

    // Log health stats
    console.log(`Health Check: ${runningJobs.length} jobs running, ${runningAgents.length} agents busy`);
  }

  /**
   * Get job status
   */
  public getJob(jobId: string): BackgroundJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs with optional filtering
   */
  public getJobs(filter?: {
    status?: BackgroundJob['status'];
    type?: BackgroundJob['type'];
    userId?: string;
  }): BackgroundJob[] {
    let jobs = Array.from(this.jobs.values());

    if (filter) {
      if (filter.status) {
        jobs = jobs.filter(j => j.status === filter.status);
      }
      if (filter.type) {
        jobs = jobs.filter(j => j.type === filter.type);
      }
      if (filter.userId) {
        jobs = jobs.filter(j => j.metadata?.userId === filter.userId);
      }
    }

    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get coordinations for a job
   */
  public getJobCoordinations(jobId: string): AgentCoordination[] {
    return Array.from(this.coordinations.values())
      .filter(c => c.jobId === jobId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Pause a job
   */
  public pauseJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'running') {
      return false;
    }

    job.status = 'paused';
    this.jobs.set(jobId, job);
    return true;
  }

  /**
   * Resume a paused job
   */
  public async resumeJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'paused') {
      return false;
    }

    return await this.startJob(jobId);
  }

  /**
   * Cancel a job
   */
  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    job.status = 'failed';
    this.jobs.set(jobId, job);

    // Cancel associated tasks
    job.tasks.forEach(taskId => {
      const task = this.pipeline.getTask(taskId);
      if (task && ['pending', 'analyzing', 'implementing'].includes(task.status)) {
        // In a real implementation, we'd have a way to cancel tasks
        console.log(`Would cancel task ${taskId}`);
      }
    });

    return true;
  }

  /**
   * Get orchestrator statistics
   */
  public getStats(): {
    totalJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingJobs: number;
    averageJobTime: number;
    agentCoordinations: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const allJobs = Array.from(this.jobs.values());
    const runningJobs = allJobs.filter(j => j.status === 'running');
    const completedJobs = allJobs.filter(j => j.status === 'completed');
    const failedJobs = allJobs.filter(j => j.status === 'failed');
    const pendingJobs = allJobs.filter(j => j.status === 'pending');

    const jobTimes = completedJobs
      .filter(j => j.lastRun)
      .map(j => {
        // Estimate completion time as lastRun + estimated duration
        const duration = 30; // Default 30 minutes
        return duration;
      });

    const averageJobTime = jobTimes.length > 0 
      ? jobTimes.reduce((a, b) => a + b, 0) / jobTimes.length 
      : 0;

    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    const failureRate = allJobs.length > 0 ? failedJobs.length / allJobs.length : 0;
    const runningJobsRatio = runningJobs.length / this.config.maxConcurrentJobs;

    if (failureRate > 0.3 || runningJobsRatio > 0.9) {
      systemHealth = 'critical';
    } else if (failureRate > 0.15 || runningJobsRatio > 0.7) {
      systemHealth = 'warning';
    }

    return {
      totalJobs: allJobs.length,
      runningJobs: runningJobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      pendingJobs: pendingJobs.length,
      averageJobTime,
      agentCoordinations: this.coordinations.size,
      systemHealth
    };
  }

  /**
   * Shutdown the orchestrator
   */
  public shutdown() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    this.pipeline.stopProcessing();
  }
}
