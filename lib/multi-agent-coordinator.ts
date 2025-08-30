import { AutonomousPipeline, AutonomousTask, AutonomousAgent } from './autonomous-pipeline';
import { BackgroundOrchestrator, BackgroundJob } from './background-orchestrator';
import { trackAIAgentUsage } from './posthog';
import { v4 as uuidv4 } from 'uuid';

export interface MessagePayload {
  taskId?: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  requiresResponse?: boolean;
  collaborationId?: string;
  role?: string;
  tasks?: string[];
  coordinationType?: string;
  conflictId?: string;
  type?: string;
  description?: string;
  requestType?: string;
  resolution?: any;
  domain?: string;
  knowledge?: any;
  confidence?: number;
  status?: string;
  results?: any;
  [key: string]: any; // Allow additional properties
}

export interface SuccessPattern {
  agentId: string;
  agentType: string;
  avgCompletionTime: number;
  taskTypes: string[];
  successIndicators: string[];
}

export interface AgentCommunication {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  messageType: 'request_assistance' | 'share_knowledge' | 'coordinate_task' | 'report_status' | 'conflict_resolution';
  content: MessagePayload;
  timestamp: Date;
  status: 'pending' | 'delivered' | 'acknowledged' | 'resolved';
  response?: {
    content: any;
    timestamp: Date;
  };
}

export interface AgentKnowledge {
  agentId: string;
  domain: string; // e.g., 'react', 'typescript', 'optimization'
  knowledge: {
    patterns: string[]; // Common code patterns
    solutions: string[]; // Known solutions to problems
    bestPractices: string[]; // Best practices learned
    commonIssues: string[]; // Issues encountered and how to solve them
  };
  confidence: number; // 0-1, how confident the agent is in this knowledge
  lastUpdated: Date;
  usageCount: number; // How many times this knowledge has been applied
}

export interface AgentCollaboration {
  id: string;
  name: string;
  description: string;
  participatingAgents: string[];
  taskIds: string[];
  coordinationType: 'sequential' | 'parallel' | 'hierarchical' | 'peer-to-peer';
  status: 'planning' | 'active' | 'completed' | 'failed';
  startTime: Date;
  estimatedCompletion: Date;
  actualCompletion?: Date;
  results?: {
    tasksCompleted: number;
    successRate: number;
    timeEfficiency: number;
    qualityScore: number;
  };
}

export interface ConflictResolution {
  id: string;
  type: 'resource_conflict' | 'approach_disagreement' | 'priority_conflict' | 'knowledge_discrepancy';
  involvedAgents: string[];
  taskId: string;
  description: string;
  proposedSolutions: Array<{
    agentId: string;
    solution: string;
    reasoning: string;
    confidence: number;
  }>;
  resolution?: {
    chosenSolution: string;
    reasoning: string;
    resolvedBy: 'voting' | 'supervisor' | 'performance_based' | 'consensus';
    timestamp: Date;
  };
  status: 'open' | 'resolved' | 'escalated';
}

export interface LearningInsight {
  id: string;
  agentId: string;
  taskId: string;
  insightType: 'pattern_recognition' | 'optimization_opportunity' | 'common_mistake' | 'best_practice';
  description: string;
  evidence: {
    dataPoints: any[]; // Changed to any[] to match usage
    confidence: number;
    validation: 'empirical' | 'theoretical' | 'peer_reviewed';
  };
  applicability: {
    domains: string[];
    taskTypes: string[];
    conditions: string[];
  };
  impact: {
    timeImprovement?: number; // percentage
    qualityImprovement?: number; // percentage
    successRateImprovement?: number; // percentage
  };
  timestamp: Date;
  validated: boolean;
  adoptedByAgents: string[];
}

export class MultiAgentCoordinator {
  private static instance: MultiAgentCoordinator;
  private pipeline: AutonomousPipeline;
  private orchestrator: BackgroundOrchestrator;
  
  private communications: Map<string, AgentCommunication> = new Map();
  private agentKnowledge: Map<string, AgentKnowledge[]> = new Map();
  private activeCollaborations: Map<string, AgentCollaboration> = new Map();
  private conflicts: Map<string, ConflictResolution> = new Map();
  private learningInsights: Map<string, LearningInsight> = new Map();
  
  private coordinationInterval?: NodeJS.Timeout;
  private learningInterval?: NodeJS.Timeout;

  constructor() {
    this.pipeline = AutonomousPipeline.getInstance();
    this.orchestrator = BackgroundOrchestrator.getInstance();
    this.startCoordination();
    this.startLearning();
  }

  public static getInstance(): MultiAgentCoordinator {
    if (!MultiAgentCoordinator.instance) {
      MultiAgentCoordinator.instance = new MultiAgentCoordinator();
    }
    return MultiAgentCoordinator.instance;
  }

  /**
   * Start the coordination system
   */
  private startCoordination() {
    this.coordinationInterval = setInterval(() => {
      this.facilitateCollaboration();
      this.resolveConflicts();
      this.shareKnowledge();
      this.optimizeAgentAssignments();
    }, 30000); // Run every 30 seconds
  }

  /**
   * Start the learning system
   */
  private startLearning() {
    this.learningInterval = setInterval(() => {
      this.analyzePerformancePatterns();
      this.generateLearningInsights();
      this.updateAgentKnowledge();
      this.crossTrainAgents();
    }, 300000); // Run every 5 minutes
  }

  /**
   * Create a new agent collaboration
   */
  public async createCollaboration(
    name: string,
    description: string,
    taskIds: string[],
    coordinationType: AgentCollaboration['coordinationType'] = 'parallel'
  ): Promise<string> {
    // Analyze tasks to determine optimal agent assignments
    const optimalAgents = await this.selectOptimalAgents(taskIds, coordinationType);
    
    const collaboration: AgentCollaboration = {
      id: `collab_${uuidv4()}`,
      name,
      description,
      participatingAgents: optimalAgents,
      taskIds,
      coordinationType,
      status: 'planning',
      startTime: new Date(),
      estimatedCompletion: this.estimateCollaborationTime(taskIds, optimalAgents, coordinationType)
    };

    this.activeCollaborations.set(collaboration.id, collaboration);

    // Send coordination messages to agents
    await this.notifyAgentsOfCollaboration(collaboration);

    return collaboration.id;
  }

  /**
   * Send a message between agents
   */
  public async sendAgentMessage(
    fromAgentId: string,
    toAgentId: string,
    messageType: AgentCommunication['messageType'],
    content: MessagePayload,
    priority: AgentCommunication['content']['priority'] = 'medium',
    requiresResponse: boolean = false
  ): Promise<string> {
    const communication: AgentCommunication = {
      id: `comm_${uuidv4()}`,
      fromAgentId,
      toAgentId,
      messageType,
      content: {
        data: content,
        priority,
        requiresResponse
      },
      timestamp: new Date(),
      status: 'pending'
    };

    this.communications.set(communication.id, communication);

    // Process the message
    await this.processAgentCommunication(communication);

    return communication.id;
  }

  /**
   * Add knowledge to an agent's knowledge base
   */
  public addAgentKnowledge(
    agentId: string,
    domain: string,
    knowledge: Partial<AgentKnowledge['knowledge']>,
    confidence: number = 0.8
  ): void {
    const existingKnowledge = this.agentKnowledge.get(agentId) || [];
    
    const domainKnowledge = existingKnowledge.find(k => k.domain === domain);
    
    if (domainKnowledge) {
      // Update existing knowledge
      domainKnowledge.knowledge = {
        patterns: [...new Set([...(domainKnowledge.knowledge.patterns || []), ...(knowledge.patterns || [])])],
        solutions: [...new Set([...(domainKnowledge.knowledge.solutions || []), ...(knowledge.solutions || [])])],
        bestPractices: [...new Set([...(domainKnowledge.knowledge.bestPractices || []), ...(knowledge.bestPractices || [])])],
        commonIssues: [...new Set([...(domainKnowledge.knowledge.commonIssues || []), ...(knowledge.commonIssues || [])])]
      };
      domainKnowledge.confidence = Math.min(domainKnowledge.confidence + (confidence * 0.1), 1.0);
      domainKnowledge.lastUpdated = new Date();
      domainKnowledge.usageCount++;
    } else {
      // Add new knowledge
      const newKnowledge: AgentKnowledge = {
        agentId,
        domain,
        knowledge: {
          patterns: knowledge.patterns || [],
          solutions: knowledge.solutions || [],
          bestPractices: knowledge.bestPractices || [],
          commonIssues: knowledge.commonIssues || []
        },
        confidence,
        lastUpdated: new Date(),
        usageCount: 1
      };
      existingKnowledge.push(newKnowledge);
    }

    this.agentKnowledge.set(agentId, existingKnowledge);
  }

  /**
   * Get agent knowledge for a specific domain
   */
  public getAgentKnowledge(agentId: string, domain?: string): AgentKnowledge[] {
    const knowledge = this.agentKnowledge.get(agentId) || [];
    return domain ? knowledge.filter(k => k.domain === domain) : knowledge;
  }

  /**
   * Create a conflict resolution case
   */
  public createConflict(
    type: ConflictResolution['type'],
    involvedAgents: string[],
    taskId: string,
    description: string
  ): string {
    const conflict: ConflictResolution = {
      id: `conflict_${uuidv4()}`,
      type,
      involvedAgents,
      taskId,
      description,
      proposedSolutions: [],
      status: 'open'
    };

    this.conflicts.set(conflict.id, conflict);

    // Request solutions from involved agents
    this.requestConflictSolutions(conflict);

    return conflict.id;
  }

  /**
   * Select optimal agents for a set of tasks
   */
  private async selectOptimalAgents(
    taskIds: string[],
    coordinationType: AgentCollaboration['coordinationType']
  ): Promise<string[]> {
    const agents = this.pipeline.getAgents();
    const tasks = taskIds.map(id => this.pipeline.getTask(id)).filter(Boolean);
    
    // Score agents based on task requirements and collaboration type
    const agentScores = agents.map(agent => {
      let score = 0;

      // Base capability matching
      for (const task of tasks) {
        if (task && agent.specialties.some(spec => task.type.includes(spec.replace('-', '')))) {
          score += 10;
        }
      }

      // Success rate bonus
      score += agent.successRate * 20;

      // Workload penalty
      score -= (agent.currentLoad / agent.maxConcurrentTasks) * 15;

      // Collaboration type adjustments
      if (coordinationType === 'hierarchical' && agent.type === 'architect') {
        score += 15; // Prefer architects for hierarchical coordination
      } else if (coordinationType === 'peer-to-peer' && agent.type === 'developer') {
        score += 10; // Prefer developers for peer-to-peer
      }

      // Knowledge bonus
      const agentKnowledge = this.getAgentKnowledge(agent.id);
      const relevantDomains = tasks.flatMap(task => task?.type.split('-') || []);
      const knowledgeBonus = agentKnowledge
        .filter(k => relevantDomains.some(domain => k.domain.includes(domain)))
        .reduce((sum, k) => sum + k.confidence, 0);
      score += knowledgeBonus * 5;

      return { agent, score };
    });

    // Select top agents (adjust number based on coordination type)
    const maxAgents = coordinationType === 'hierarchical' ? Math.min(3, tasks.length) : 
                     coordinationType === 'sequential' ? Math.min(2, tasks.length) : 
                     Math.min(4, tasks.length);

    return agentScores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxAgents)
      .map(({ agent }) => agent.id);
  }

  /**
   * Estimate collaboration completion time
   */
  private estimateCollaborationTime(
    taskIds: string[],
    agentIds: string[],
    coordinationType: AgentCollaboration['coordinationType']
  ): Date {
    const tasks = taskIds.map(id => this.pipeline.getTask(id)).filter(Boolean);
    const totalEstimatedTime = tasks.reduce((sum, task) => sum + (task?.estimatedTime || 30), 0);

    let adjustedTime = totalEstimatedTime;

    switch (coordinationType) {
      case 'parallel':
        adjustedTime = Math.ceil(totalEstimatedTime / agentIds.length); // Parallel execution
        break;
      case 'sequential':
        adjustedTime = totalEstimatedTime; // Sequential execution
        break;
      case 'hierarchical':
        adjustedTime = totalEstimatedTime * 0.8; // Some parallel, some coordination overhead
        break;
      case 'peer-to-peer':
        adjustedTime = totalEstimatedTime * 0.9; // Slight coordination overhead
        break;
    }

    return new Date(Date.now() + adjustedTime * 60 * 1000);
  }

  /**
   * Notify agents of new collaboration
   */
  private async notifyAgentsOfCollaboration(collaboration: AgentCollaboration) {
    for (const agentId of collaboration.participatingAgents) {
      await this.sendAgentMessage(
        'coordinator',
        agentId,
        'coordinate_task',
        {
          collaborationId: collaboration.id,
          role: this.determineAgentRole(agentId, collaboration),
          tasks: collaboration.taskIds,
          coordinationType: collaboration.coordinationType
        },
        'high',
        true
      );
    }
  }

  /**
   * Determine agent's role in collaboration
   */
  private determineAgentRole(agentId: string, collaboration: AgentCollaboration): string {
    const agent = this.pipeline.getAgents().find(a => a.id === agentId);
    if (!agent) return 'participant';

    switch (collaboration.coordinationType) {
      case 'hierarchical':
        if (agent.type === 'architect') return 'coordinator';
        if (agent.type === 'reviewer') return 'quality_controller';
        return 'executor';
      case 'peer-to-peer':
        return 'peer';
      case 'sequential':
        const index = collaboration.participatingAgents.indexOf(agentId);
        return index === 0 ? 'initiator' : index === collaboration.participatingAgents.length - 1 ? 'finalizer' : 'processor';
      case 'parallel':
        return 'parallel_executor';
      default:
        return 'participant';
    }
  }

  /**
   * Facilitate active collaborations
   */
  private async facilitateCollaboration() {
    for (const collaboration of this.activeCollaborations.values()) {
      if (collaboration.status === 'active') {
        await this.monitorCollaboration(collaboration);
      } else if (collaboration.status === 'planning') {
        await this.activateCollaboration(collaboration);
      }
    }
  }

  /**
   * Monitor an active collaboration
   */
  private async monitorCollaboration(collaboration: AgentCollaboration) {
    const tasks = collaboration.taskIds.map(id => this.pipeline.getTask(id)).filter(Boolean);
    const completedTasks = tasks.filter(task => task?.status === 'completed');
    const failedTasks = tasks.filter(task => task?.status === 'failed');

    // Check for completion
    if (completedTasks.length === tasks.length) {
      collaboration.status = 'completed';
      collaboration.actualCompletion = new Date();
      collaboration.results = {
        tasksCompleted: completedTasks.length,
        successRate: completedTasks.length / tasks.length,
        timeEfficiency: this.calculateTimeEfficiency(collaboration),
        qualityScore: this.calculateQualityScore(completedTasks)
      };

      // Notify agents of completion
      await this.notifyCollaborationCompletion(collaboration);
    } else if (failedTasks.length > tasks.length * 0.5) {
      // More than 50% failed
      collaboration.status = 'failed';
      await this.handleCollaborationFailure(collaboration);
    }
  }

  /**
   * Activate a collaboration
   */
  private async activateCollaboration(collaboration: AgentCollaboration) {
    collaboration.status = 'active';
    this.activeCollaborations.set(collaboration.id, collaboration);

    // Track collaboration start
    trackAIAgentUsage('system', 'multi-agent-coordinator', 'collaboration-started');
  }

  /**
   * Calculate time efficiency
   */
  private calculateTimeEfficiency(collaboration: AgentCollaboration): number {
    if (!collaboration.actualCompletion) return 0;

    const actualTime = collaboration.actualCompletion.getTime() - collaboration.startTime.getTime();
    const estimatedTime = collaboration.estimatedCompletion.getTime() - collaboration.startTime.getTime();

    return Math.max(0, Math.min(1, estimatedTime / actualTime));
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(completedTasks: any[]): number {
    // Simplified quality scoring based on task results
    return completedTasks.reduce((sum, task) => {
      const baseScore = 0.8; // Base quality score
      const errorPenalty = (task.results?.errors?.length || 0) * 0.1;
      return sum + Math.max(0.1, baseScore - errorPenalty);
    }, 0) / completedTasks.length;
  }

  /**
   * Process agent communication
   */
  private async processAgentCommunication(communication: AgentCommunication) {
    communication.status = 'delivered';

    switch (communication.messageType) {
      case 'request_assistance':
        await this.handleAssistanceRequest(communication);
        break;
      case 'share_knowledge':
        await this.handleKnowledgeSharing(communication);
        break;
      case 'coordinate_task':
        await this.handleTaskCoordination(communication);
        break;
      case 'report_status':
        await this.handleStatusReport(communication);
        break;
      case 'conflict_resolution':
        await this.handleConflictResolution(communication);
        break;
    }

    this.communications.set(communication.id, communication);
  }

  /**
   * Handle assistance request
   */
  private async handleAssistanceRequest(communication: AgentCommunication) {
    const { taskId, data } = communication.content;
    
    // Find agents with relevant knowledge
    const relevantAgents = this.findAgentsWithKnowledge(data.domain || 'general');
    
    if (relevantAgents.length > 0) {
      // Send knowledge to requesting agent
      const bestAgent = relevantAgents[0];
      const knowledge = this.getAgentKnowledge(bestAgent.agentId, data.domain);
      
      communication.response = {
        content: {
          assistance: knowledge,
          recommendations: this.generateAssistanceRecommendations(knowledge, data.problem)
        },
        timestamp: new Date()
      };
      communication.status = 'resolved';
    }
  }

  /**
   * Handle knowledge sharing
   */
  private async handleKnowledgeSharing(communication: AgentCommunication) {
    const { data } = communication.content;
    
    this.addAgentKnowledge(
      communication.fromAgentId,
      data.domain,
      data.knowledge,
      data.confidence || 0.8
    );

    communication.status = 'acknowledged';
  }

  /**
   * Find agents with relevant knowledge
   */
  private findAgentsWithKnowledge(domain: string): AgentKnowledge[] {
    const relevantKnowledge: AgentKnowledge[] = [];
    
    for (const [agentId, knowledgeList] of this.agentKnowledge.entries()) {
      const domainKnowledge = knowledgeList.filter(k => 
        k.domain.toLowerCase().includes(domain.toLowerCase()) && k.confidence > 0.6
      );
      relevantKnowledge.push(...domainKnowledge);
    }

    return relevantKnowledge.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate assistance recommendations
   */
  private generateAssistanceRecommendations(knowledge: AgentKnowledge[], problem: string): string[] {
    const recommendations: string[] = [];
    
    for (const k of knowledge.slice(0, 3)) { // Top 3 knowledge items
      if (k.knowledge.solutions.length > 0) {
        recommendations.push(`Based on ${k.domain} experience: ${k.knowledge.solutions[0]}`);
      }
      if (k.knowledge.bestPractices.length > 0) {
        recommendations.push(`Best practice: ${k.knowledge.bestPractices[0]}`);
      }
    }

    return recommendations;
  }

  /**
   * Handle task coordination
   */
  private async handleTaskCoordination(communication: AgentCommunication) {
    communication.status = 'acknowledged';
    // Implementation for task coordination logic
  }

  /**
   * Handle status report
   */
  private async handleStatusReport(communication: AgentCommunication) {
    communication.status = 'acknowledged';
    // Implementation for status report processing
  }

  /**
   * Handle conflict resolution
   */
  private async handleConflictResolution(communication: AgentCommunication) {
    communication.status = 'acknowledged';
    // Implementation for conflict resolution processing
  }

  /**
   * Resolve conflicts
   */
  private async resolveConflicts() {
    for (const conflict of this.conflicts.values()) {
      if (conflict.status === 'open' && conflict.proposedSolutions.length >= conflict.involvedAgents.length) {
        await this.evaluateAndResolveConflict(conflict);
      }
    }
  }

  /**
   * Request conflict solutions from agents
   */
  private async requestConflictSolutions(conflict: ConflictResolution) {
    for (const agentId of conflict.involvedAgents) {
      await this.sendAgentMessage(
        'coordinator',
        agentId,
        'conflict_resolution',
        {
          conflictId: conflict.id,
          type: conflict.type,
          description: conflict.description,
          requestType: 'propose_solution'
        },
        'high',
        true
      );
    }
  }

  /**
   * Evaluate and resolve conflict
   */
  private async evaluateAndResolveConflict(conflict: ConflictResolution) {
    // Score solutions based on agent performance and confidence
    const scoredSolutions = conflict.proposedSolutions.map(solution => {
      const agent = this.pipeline.getAgents().find(a => a.id === solution.agentId);
      const agentScore = agent ? agent.successRate * 0.7 + solution.confidence * 0.3 : solution.confidence;
      return { ...solution, score: agentScore };
    });

    // Select best solution
    const bestSolution = scoredSolutions.sort((a, b) => b.score - a.score)[0];

    conflict.resolution = {
      chosenSolution: bestSolution.solution,
      reasoning: `Selected based on agent performance (${bestSolution.score.toFixed(2)}) and solution confidence`,
      resolvedBy: 'performance_based',
      timestamp: new Date()
    };
    conflict.status = 'resolved';

    this.conflicts.set(conflict.id, conflict);

    // Notify agents of resolution
    await this.notifyConflictResolution(conflict);
  }

  /**
   * Notify agents of conflict resolution
   */
  private async notifyConflictResolution(conflict: ConflictResolution) {
    for (const agentId of conflict.involvedAgents) {
      await this.sendAgentMessage(
        'coordinator',
        agentId,
        'conflict_resolution',
        {
          conflictId: conflict.id,
          resolution: conflict.resolution,
          requestType: 'notify_resolution'
        },
        'medium',
        false
      );
    }
  }

  /**
   * Share knowledge between agents
   */
  private async shareKnowledge() {
    const agents = this.pipeline.getAgents();
    
    // Find knowledge sharing opportunities
    for (const agent of agents) {
      const agentKnowledge = this.getAgentKnowledge(agent.id);
      const highConfidenceKnowledge = agentKnowledge.filter(k => k.confidence > 0.8);
      
      if (highConfidenceKnowledge.length > 0) {
        // Find agents who could benefit from this knowledge
        const beneficiaryAgents = agents.filter(a => 
          a.id !== agent.id && 
          a.specialties.some(spec => 
            highConfidenceKnowledge.some(k => k.domain.includes(spec))
          )
        );

        // Share knowledge with up to 2 relevant agents
        for (const beneficiary of beneficiaryAgents.slice(0, 2)) {
          const relevantKnowledge = highConfidenceKnowledge.filter(k =>
            beneficiary.specialties.some(spec => k.domain.includes(spec))
          )[0];

          if (relevantKnowledge) {
            await this.sendAgentMessage(
              agent.id,
              beneficiary.id,
              'share_knowledge',
              {
                domain: relevantKnowledge.domain,
                knowledge: relevantKnowledge.knowledge,
                confidence: relevantKnowledge.confidence
              },
              'low',
              false
            );
          }
        }
      }
    }
  }

  /**
   * Optimize agent assignments
   */
  private async optimizeAgentAssignments() {
    // Analyze current assignments and suggest improvements
    const runningTasks = this.pipeline.getTasks({ status: 'implementing' });
    
    for (const task of runningTasks) {
      if (task.assignedAgent) {
        const agent = this.pipeline.getAgents().find(a => a.id === task.assignedAgent);
        if (agent && agent.currentLoad > agent.maxConcurrentTasks * 0.8) {
          // Agent is overloaded, suggest rebalancing
          await this.suggestTaskReassignment(task, agent);
        }
      }
    }
  }

  /**
   * Suggest task reassignment
   */
  private async suggestTaskReassignment(task: any, overloadedAgent: any) {
    const availableAgents = this.pipeline.getAgents().filter(a => 
      a.id !== overloadedAgent.id && 
      a.currentLoad < a.maxConcurrentTasks * 0.6 &&
      a.specialties.some(spec => task.type.includes(spec.replace('-', '')))
    );

    if (availableAgents.length > 0) {
      const bestAgent = availableAgents.sort((a, b) => b.successRate - a.successRate)[0];
      
      console.log(`Suggesting task ${task.id} reassignment from ${overloadedAgent.id} to ${bestAgent.id}`);
      // In a real implementation, this would trigger a reassignment process
    }
  }

  /**
   * Analyze performance patterns
   */
  private analyzePerformancePatterns() {
    const agents = this.pipeline.getAgents();
    const completedTasks = this.pipeline.getTasks({ status: 'completed' });
    
    // Analyze patterns in successful task completions
    const patterns = this.identifySuccessPatterns(completedTasks, agents);
    
    // Generate insights from patterns
    for (const pattern of patterns) {
      this.generateInsightFromPattern(pattern);
    }
  }

  /**
   * Identify success patterns
   */
  private identifySuccessPatterns(tasks: any[], agents: any[]): any[] {
    const patterns: any[] = [];
    
    // Group tasks by agent and analyze success rates
    const agentTaskGroups = agents.map(agent => ({
      agent,
      tasks: tasks.filter(task => task.assignedAgent === agent.id)
    }));

    for (const group of agentTaskGroups) {
      if (group.tasks.length >= 3) { // Minimum sample size
        const avgTime = group.tasks.reduce((sum, task) => {
          const startTime = task.startedAt ? new Date(task.startedAt).getTime() : 0;
          const completedTime = task.completedAt ? new Date(task.completedAt).getTime() : 0;
          return sum + (completedTime - startTime);
        }, 0) / group.tasks.length;

        patterns.push({
          agentId: group.agent.id,
          agentType: group.agent.type,
          avgCompletionTime: avgTime,
          taskTypes: [...new Set(group.tasks.map(t => t.type))],
          successIndicators: this.extractSuccessIndicators(group.tasks)
        });
      }
    }

    return patterns;
  }

  /**
   * Extract success indicators from tasks
   */
  private extractSuccessIndicators(tasks: any[]): string[] {
    const indicators: string[] = [];
    
    // Analyze common characteristics of successful tasks
    const hasLowPriority = tasks.filter(t => t.priority === 'low').length / tasks.length > 0.6;
    const hasShortEstimate = tasks.filter(t => t.estimatedTime <= 20).length / tasks.length > 0.6;
    
    if (hasLowPriority) indicators.push('performs_well_on_low_priority_tasks');
    if (hasShortEstimate) indicators.push('efficient_with_short_tasks');
    
    return indicators;
  }

  /**
   * Generate insight from pattern
   */
  private generateInsightFromPattern(pattern: any) {
    const insight: LearningInsight = {
      id: `insight_${uuidv4()}`,
      agentId: pattern.agentId,
      taskId: 'pattern_analysis',
      insightType: 'pattern_recognition',
      description: `Agent ${pattern.agentId} shows optimal performance with ${pattern.successIndicators.join(', ')}`,
      evidence: {
        dataPoints: [pattern],
        confidence: 0.7,
        validation: 'empirical'
      },
      applicability: {
        domains: pattern.taskTypes,
        taskTypes: pattern.taskTypes,
        conditions: pattern.successIndicators
      },
      impact: {
        timeImprovement: pattern.avgCompletionTime < 1800000 ? 15 : 0, // If under 30 minutes
        successRateImprovement: 10
      },
      timestamp: new Date(),
      validated: false,
      adoptedByAgents: []
    };

    this.learningInsights.set(insight.id, insight);
  }

  /**
   * Generate learning insights
   */
  private generateLearningInsights() {
    // Implementation for generating new learning insights
    console.log('Generating learning insights from recent performance data');
  }

  /**
   * Update agent knowledge based on insights
   */
  private updateAgentKnowledge() {
    // Implementation for updating agent knowledge
    console.log('Updating agent knowledge based on validated insights');
  }

  /**
   * Cross-train agents with successful patterns
   */
  private crossTrainAgents() {
    // Implementation for cross-training agents
    console.log('Cross-training agents with successful patterns');
  }

  /**
   * Notify agents of collaboration completion
   */
  private async notifyCollaborationCompletion(collaboration: AgentCollaboration) {
    for (const agentId of collaboration.participatingAgents) {
      await this.sendAgentMessage(
        'coordinator',
        agentId,
        'report_status',
        {
          collaborationId: collaboration.id,
          status: 'completed',
          results: collaboration.results
        },
        'medium',
        false
      );
    }
  }

  /**
   * Handle collaboration failure
   */
  private async handleCollaborationFailure(collaboration: AgentCollaboration) {
    console.log(`Collaboration ${collaboration.id} failed - implementing recovery procedures`);
    
    // Analyze failure causes and implement recovery
    const failureAnalysis = this.analyzeCollaborationFailure(collaboration);
    
    // Create new collaboration with different strategy if possible
    if (failureAnalysis.recoverable) {
      await this.createRecoveryCollaboration(collaboration, failureAnalysis);
    }
  }

  /**
   * Analyze collaboration failure
   */
  private analyzeCollaborationFailure(collaboration: AgentCollaboration): { recoverable: boolean; causes: string[] } {
    return {
      recoverable: true,
      causes: ['agent_overload', 'task_complexity']
    };
  }

  /**
   * Create recovery collaboration
   */
  private async createRecoveryCollaboration(
    failedCollaboration: AgentCollaboration, 
    analysis: { recoverable: boolean; causes: string[] }
  ) {
    // Implementation for creating recovery collaboration
    console.log(`Creating recovery collaboration for ${failedCollaboration.id}`);
  }

  /**
   * Get coordination statistics
   */
  public getCoordinationStats(): {
    activeCollaborations: number;
    completedCollaborations: number;
    communicationVolume: number;
    conflictResolutionRate: number;
    knowledgeSharingEvents: number;
    learningInsights: number;
  } {
    const activeCollaborations = Array.from(this.activeCollaborations.values())
      .filter(c => c.status === 'active').length;
    
    const completedCollaborations = Array.from(this.activeCollaborations.values())
      .filter(c => c.status === 'completed').length;

    const communicationVolume = this.communications.size;

    const resolvedConflicts = Array.from(this.conflicts.values())
      .filter(c => c.status === 'resolved').length;
    const totalConflicts = this.conflicts.size;
    const conflictResolutionRate = totalConflicts > 0 ? resolvedConflicts / totalConflicts : 1;

    const knowledgeSharingEvents = Array.from(this.communications.values())
      .filter(c => c.messageType === 'share_knowledge').length;

    return {
      activeCollaborations,
      completedCollaborations,
      communicationVolume,
      conflictResolutionRate,
      knowledgeSharingEvents,
      learningInsights: this.learningInsights.size
    };
  }

  /**
   * Get all active collaborations
   */
  public getActiveCollaborations(): AgentCollaboration[] {
    return Array.from(this.activeCollaborations.values())
      .filter(c => c.status === 'active');
  }

  /**
   * Get recent communications
   */
  public getRecentCommunications(limit: number = 20): AgentCommunication[] {
    return Array.from(this.communications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get conflicts by status
   */
  public getConflicts(status?: ConflictResolution['status']): ConflictResolution[] {
    const conflicts = Array.from(this.conflicts.values());
    return status ? conflicts.filter(c => c.status === status) : conflicts;
  }

  /**
   * Get learning insights
   */
  public getLearningInsights(validated?: boolean): LearningInsight[] {
    const insights = Array.from(this.learningInsights.values());
    return validated !== undefined ? insights.filter(i => i.validated === validated) : insights;
  }

  /**
   * Shutdown coordination system
   */
  public shutdown() {
    if (this.coordinationInterval) {
      clearInterval(this.coordinationInterval);
      this.coordinationInterval = undefined;
    }
    
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = undefined;
    }
  }
}
