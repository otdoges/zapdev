import { IntegratedAISystem, AIRequest } from './integrated-ai-system';
import { trackAIAgentUsage } from './posthog';

export interface AutonomousTask {
  id: string;
  type: 'feature-development' | 'bug-fix' | 'optimization' | 'testing' | 'documentation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'analyzing' | 'implementing' | 'testing' | 'completed' | 'failed';
  assignedAgent?: string;
  dependencies?: string[]; // Task IDs this depends on
  estimatedTime: number; // minutes
  progress: number; // 0-100
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  results?: {
    filesCreated: string[];
    filesModified: string[];
    errors?: string[];
    summary: string;
  };
  metadata?: {
    userQuery?: string;
    codebaseContext?: string;
    subscriptionType?: 'free' | 'pro' | 'enterprise';
  };
}

export interface AutonomousAgent {
  id: string;
  type: 'architect' | 'developer' | 'reviewer' | 'deployer' | 'researcher' | 'optimizer';
  name: string;
  status: 'idle' | 'busy' | 'offline';
  capabilities: string[];
  currentTask?: string; // Task ID
  tasksCompleted: number;
  successRate: number; // 0-1
  averageTaskTime: number; // minutes
  specialties: string[];
  maxConcurrentTasks: number;
  currentLoad: number; // 0-maxConcurrentTasks
}

export interface PipelineConfig {
  maxConcurrentTasks: number;
  maxAgentsPerTask: number;
  autoRetryFailedTasks: boolean;
  requireApprovalFor: ('critical' | 'high' | 'medium' | 'low')[];
  notificationWebhook?: string;
}

export class AutonomousPipeline {
  private static instance: AutonomousPipeline;
  private aiSystem: IntegratedAISystem;
  private tasks: Map<string, AutonomousTask> = new Map();
  private agents: Map<string, AutonomousAgent> = new Map();
  private config: PipelineConfig;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    this.aiSystem = IntegratedAISystem.getInstance();
    this.config = {
      maxConcurrentTasks: 5,
      maxAgentsPerTask: 2,
      autoRetryFailedTasks: true,
      requireApprovalFor: ['critical', 'high']
    };
    
    this.initializeAgents();
    this.startProcessing();
  }

  public static getInstance(): AutonomousPipeline {
    if (!AutonomousPipeline.instance) {
      AutonomousPipeline.instance = new AutonomousPipeline();
    }
    return AutonomousPipeline.instance;
  }

  /**
   * Initialize default agents
   */
  private initializeAgents() {
    const defaultAgents: AutonomousAgent[] = [
      {
        id: 'architect-01',
        type: 'architect',
        name: 'System Architect',
        status: 'idle',
        capabilities: ['system-design', 'architecture-planning', 'tech-stack-selection'],
        tasksCompleted: 0,
        successRate: 0.95,
        averageTaskTime: 15,
        specialties: ['system-architecture', 'database-design', 'api-design'],
        maxConcurrentTasks: 2,
        currentLoad: 0
      },
      {
        id: 'developer-01',
        type: 'developer',
        name: 'Full-Stack Developer',
        status: 'idle',
        capabilities: ['frontend-development', 'backend-development', 'database-operations'],
        tasksCompleted: 0,
        successRate: 0.88,
        averageTaskTime: 25,
        specialties: ['react', 'typescript', 'nextjs', 'node', 'sql'],
        maxConcurrentTasks: 3,
        currentLoad: 0
      },
      {
        id: 'reviewer-01',
        type: 'reviewer',
        name: 'Code Reviewer',
        status: 'idle',
        capabilities: ['code-review', 'security-audit', 'performance-analysis'],
        tasksCompleted: 0,
        successRate: 0.92,
        averageTaskTime: 10,
        specialties: ['code-quality', 'security', 'best-practices'],
        maxConcurrentTasks: 4,
        currentLoad: 0
      },
      {
        id: 'optimizer-01',
        type: 'optimizer',
        name: 'Performance Optimizer',
        status: 'idle',
        capabilities: ['performance-optimization', 'bundle-analysis', 'database-optimization'],
        tasksCompleted: 0,
        successRate: 0.85,
        averageTaskTime: 20,
        specialties: ['performance', 'optimization', 'caching'],
        maxConcurrentTasks: 2,
        currentLoad: 0
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  /**
   * Submit a new autonomous task
   */
  public async submitTask(taskData: Omit<AutonomousTask, 'id' | 'status' | 'progress' | 'createdAt'>): Promise<string> {
    const task: AutonomousTask = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.tasks.set(task.id, task);

    // Track task submission
    if (task.metadata?.subscriptionType) {
      trackAIAgentUsage('anonymous', 'autonomous-pipeline', 'task-submitted');
    }

    return task.id;
  }

  /**
   * Get task status
   */
  public getTask(taskId: string): AutonomousTask | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get all tasks with optional filtering
   */
  public getTasks(filter?: {
    status?: AutonomousTask['status'];
    type?: AutonomousTask['type'];
    priority?: AutonomousTask['priority'];
  }): AutonomousTask[] {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      if (filter.status) {
        tasks = tasks.filter(t => t.status === filter.status);
      }
      if (filter.type) {
        tasks = tasks.filter(t => t.type === filter.type);
      }
      if (filter.priority) {
        tasks = tasks.filter(t => t.priority === filter.priority);
      }
    }

    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get all agents with their current status
   */
  public getAgents(): AutonomousAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Start the autonomous processing loop
   */
  private startProcessing() {
    // Process tasks every 5 seconds
    this.processingInterval = setInterval(() => {
      this.processPendingTasks();
    }, 5000);
  }

  /**
   * Stop the autonomous processing
   */
  public stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Process pending tasks and assign to available agents
   */
  private async processPendingTasks() {
    const pendingTasks = this.getTasks({ status: 'pending' });
    const availableAgents = this.getAvailableAgents();

    // Sort tasks by priority and creation time
    const sortedTasks = pendingTasks.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    for (const task of sortedTasks) {
      // Check if we've reached max concurrent tasks
      const runningTasks = this.getTasks({ status: 'implementing' }).length;
      if (runningTasks >= this.config.maxConcurrentTasks) {
        break;
      }

      // Check dependencies
      if (task.dependencies && !this.areDependenciesMet(task.dependencies)) {
        continue;
      }

      // Find suitable agent
      const suitableAgent = this.findSuitableAgent(task, availableAgents);
      if (suitableAgent) {
        await this.assignTaskToAgent(task, suitableAgent);
      }
    }
  }

  /**
   * Check if task dependencies are met
   */
  private areDependenciesMet(dependencies: string[]): boolean {
    return dependencies.every(depId => {
      const depTask = this.tasks.get(depId);
      return depTask && depTask.status === 'completed';
    });
  }

  /**
   * Find the most suitable agent for a task
   */
  private findSuitableAgent(task: AutonomousTask, availableAgents: AutonomousAgent[]): AutonomousAgent | null {
    // Score agents based on suitability
    const scoredAgents = availableAgents.map(agent => {
      let score = 0;

      // Base compatibility score
      if (task.type === 'feature-development' && agent.type === 'developer') score += 10;
      if (task.type === 'bug-fix' && (agent.type === 'developer' || agent.type === 'reviewer')) score += 8;
      if (task.type === 'optimization' && agent.type === 'optimizer') score += 10;
      if (task.type === 'testing' && agent.type === 'reviewer') score += 9;

      // Success rate bonus
      score += agent.successRate * 5;

      // Workload penalty
      score -= (agent.currentLoad / agent.maxConcurrentTasks) * 3;

      // Priority boost for high-priority tasks
      if (task.priority === 'critical') score += 5;
      if (task.priority === 'high') score += 3;

      return { agent, score };
    });

    const bestMatch = scoredAgents
      .filter(({ agent }) => agent.currentLoad < agent.maxConcurrentTasks)
      .sort((a, b) => b.score - a.score)[0];

    return bestMatch?.agent || null;
  }

  /**
   * Get available agents (not at capacity)
   */
  private getAvailableAgents(): AutonomousAgent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.status !== 'offline' && agent.currentLoad < agent.maxConcurrentTasks);
  }

  /**
   * Assign a task to an agent
   */
  private async assignTaskToAgent(task: AutonomousTask, agent: AutonomousAgent) {
    // Update task status
    task.status = 'analyzing';
    task.assignedAgent = agent.id;
    task.startedAt = new Date();
    this.tasks.set(task.id, task);

    // Update agent status
    agent.currentLoad++;
    agent.currentTask = task.id;
    agent.status = 'busy';
    this.agents.set(agent.id, agent);

    try {
      // Execute the task
      await this.executeTask(task, agent);
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
      this.handleTaskFailure(task, agent, error);
    }
  }

  /**
   * Execute a task using the AI system
   */
  private async executeTask(task: AutonomousTask, agent: AutonomousAgent) {
    // Update progress
    task.progress = 10;
    task.status = 'implementing';
    this.tasks.set(task.id, task);

    // Prepare AI request based on task type and agent capabilities
    const aiRequest: AIRequest = {
      userQuery: this.formatTaskForAI(task, agent),
      subscriptionType: task.metadata?.subscriptionType || 'free',
      urgency: (task.priority === 'critical' ? 'high' : 'medium') as 'low' | 'medium' | 'high',
      projectType: 'web-app' as const,
      codebaseContext: task.metadata?.codebaseContext
    };

    // Process with AI system
    const aiResponse = await this.aiSystem.processRequest(aiRequest);

    // Simulate task execution (in real implementation, this would generate actual code)
    await this.simulateTaskExecution(task, agent, aiResponse);

    // Complete the task
    this.completeTask(task, agent);
  }

  /**
   * Format task description for AI processing
   */
  private formatTaskForAI(task: AutonomousTask, agent: AutonomousAgent): string {
    let prompt = `As a ${agent.type} agent specializing in ${agent.specialties.join(', ')}, `;
    prompt += `please ${task.type.replace('-', ' ')} the following:\n\n`;
    prompt += `Title: ${task.title}\n`;
    prompt += `Description: ${task.description}\n\n`;
    prompt += `Priority: ${task.priority}\n`;
    prompt += `Estimated time: ${task.estimatedTime} minutes\n\n`;
    
    if (task.dependencies && task.dependencies.length > 0) {
      prompt += `Dependencies: This task depends on completion of tasks ${task.dependencies.join(', ')}\n\n`;
    }

    prompt += `Please provide a complete implementation following best practices.`;
    
    return prompt;
  }

  /**
   * Simulate task execution (replace with real implementation)
   */
  private async simulateTaskExecution(task: AutonomousTask, agent: AutonomousAgent, aiResponse: any) {
    const steps = Math.ceil(task.estimatedTime / 5); // 5-minute intervals
    
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
      task.progress = Math.min(10 + (i / steps) * 80, 90);
      this.tasks.set(task.id, task);
    }
  }

  /**
   * Complete a task successfully
   */
  private completeTask(task: AutonomousTask, agent: AutonomousAgent) {
    // Update task
    task.status = 'completed';
    task.progress = 100;
    task.completedAt = new Date();
    task.results = {
      filesCreated: [`src/components/${task.title.replace(/\s+/g, '')}.tsx`],
      filesModified: ['src/App.tsx', 'src/index.tsx'],
      summary: `Successfully ${task.type.replace('-', ' ')} "${task.title}"`
    };
    this.tasks.set(task.id, task);

    // Update agent
    agent.currentLoad--;
    agent.currentTask = undefined;
    agent.status = agent.currentLoad > 0 ? 'busy' : 'idle';
    agent.tasksCompleted++;
    
    // Update success rate
    const totalTasks = agent.tasksCompleted;
    agent.successRate = (agent.successRate * (totalTasks - 1) + 1) / totalTasks;
    
    this.agents.set(agent.id, agent);

    // Track completion
    trackAIAgentUsage('anonymous', agent.type, 'task-completed');
  }

  /**
   * Handle task failure
   */
  private handleTaskFailure(task: AutonomousTask, agent: AutonomousAgent, error: any) {
    task.status = 'failed';
    task.results = {
      filesCreated: [],
      filesModified: [],
      errors: [error instanceof Error ? error.message : String(error)],
      summary: `Failed to complete "${task.title}"`
    };
    this.tasks.set(task.id, task);

    // Update agent
    agent.currentLoad--;
    agent.currentTask = undefined;
    agent.status = agent.currentLoad > 0 ? 'busy' : 'idle';
    
    // Update success rate
    const totalAttempts = agent.tasksCompleted + 1;
    agent.successRate = (agent.successRate * agent.tasksCompleted) / totalAttempts;
    
    this.agents.set(agent.id, agent);

    // Auto-retry if configured
    if (this.config.autoRetryFailedTasks && task.priority !== 'low') {
      setTimeout(() => {
        task.status = 'pending';
        task.assignedAgent = undefined;
        this.tasks.set(task.id, task);
      }, 30000); // Retry after 30 seconds
    }
  }

  /**
   * Get pipeline statistics
   */
  public getStats(): {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    pendingTasks: number;
    runningTasks: number;
    averageCompletionTime: number;
    agentUtilization: number;
  } {
    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const failedTasks = allTasks.filter(t => t.status === 'failed');
    const pendingTasks = allTasks.filter(t => t.status === 'pending');
    const runningTasks = allTasks.filter(t => ['analyzing', 'implementing', 'testing'].includes(t.status));

    const completionTimes = completedTasks
      .filter(t => t.startedAt && t.completedAt)
      .map(t => (t.completedAt!.getTime() - t.startedAt!.getTime()) / 1000 / 60); // minutes

    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
      : 0;

    const totalAgentCapacity = Array.from(this.agents.values())
      .reduce((sum, agent) => sum + agent.maxConcurrentTasks, 0);
    const currentAgentLoad = Array.from(this.agents.values())
      .reduce((sum, agent) => sum + agent.currentLoad, 0);
    const agentUtilization = totalAgentCapacity > 0 ? currentAgentLoad / totalAgentCapacity : 0;

    return {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      pendingTasks: pendingTasks.length,
      runningTasks: runningTasks.length,
      averageCompletionTime,
      agentUtilization
    };
  }
}
