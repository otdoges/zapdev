import { AIModelSelector, TaskContext, ModelRecommendation } from './ai-model-selector';
import { trackFeatureUsage } from './posthog';
import { getSystemPrompt, getDecisionMakingPrompt, getDecisionMakingPromptNext, CHAT_SYSTEM_PROMPT, SystemPromptOptions } from './system-prompts';

export interface DecisionContext {
  userQuery: string;
  codebaseContext?: string;
  currentFiles?: string[];
  userPreferences?: {
    preferredLanguages?: string[];
    codingStyle?: 'minimal' | 'verbose' | 'modern';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  };
  projectType?: 'web-app' | 'api' | 'mobile' | 'desktop' | 'library';
  urgency?: 'low' | 'medium' | 'high';
  subscriptionType?: 'free' | 'pro' | 'enterprise';
}

export interface DecisionPlan {
  strategy: 'direct-implementation' | 'iterative-development' | 'analysis-first' | 'multi-stage';
  recommendedModel: ModelRecommendation;
  steps: DecisionStep[];
  estimatedTime: number; // minutes
  complexity: 'simple' | 'medium' | 'complex';
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface DecisionStep {
  id: string;
  type: 'analysis' | 'code-generation' | 'testing' | 'optimization' | 'review';
  description: string;
  estimatedTime: number; // minutes
  priority: 'low' | 'medium' | 'high';
  dependencies?: string[]; // step IDs this depends on
  modelOverride?: string; // use different model for this step
}

export class DecisionPromptSystem {
  private static instance: DecisionPromptSystem;
  private modelSelector: AIModelSelector;

  constructor() {
    this.modelSelector = AIModelSelector.getInstance();
  }

  public static getInstance(): DecisionPromptSystem {
    if (!DecisionPromptSystem.instance) {
      DecisionPromptSystem.instance = new DecisionPromptSystem();
    }
    return DecisionPromptSystem.instance;
  }

  /**
   * Analyzes user request and creates an optimal execution plan
   */
  public async createDecisionPlan(context: DecisionContext): Promise<DecisionPlan> {
    const { userQuery, urgency = 'medium', subscriptionType = 'free' } = context;
    
    // Analyze the task complexity and type
    const taskAnalysis = this.analyzeTask(userQuery, context);
    
    // Get model recommendation
    const taskContext: TaskContext = {
      type: taskAnalysis.type,
      complexity: taskAnalysis.complexity,
      priority: urgency === 'high' ? 'high' : 'normal',
      language: this.detectLanguage(userQuery, context),
      framework: this.detectFramework(userQuery, context),
      timeConstraint: urgency === 'high' ? 'fast' : 'none',
      qualityPreference: subscriptionType === 'pro' ? 'quality' : 'balanced'
    };

    const recommendedModel = this.modelSelector.recommendModel(taskContext);
    
    // Create execution strategy based on analysis
    const strategy = this.determineStrategy(taskAnalysis, context, subscriptionType);
    const steps = this.generateSteps(strategy, taskAnalysis, context);
    
    // Calculate risk and time estimates
    const riskLevel = this.assessRisk(taskAnalysis, context);
    const estimatedTime = steps.reduce((total, step) => total + step.estimatedTime, 0);
    
    const plan: DecisionPlan = {
      strategy,
      recommendedModel,
      steps,
      estimatedTime,
      complexity: taskAnalysis.complexity,
      riskLevel,
      reasoning: this.generateReasoning(strategy, taskAnalysis, recommendedModel, context)
    };

    // Track usage for analytics
    if (context.subscriptionType) {
      trackFeatureUsage(
        'anonymous', // Will be set properly when user is available
        'decision-prompt-system',
        subscriptionType === 'pro',
        {
          strategy,
          complexity: taskAnalysis.complexity,
          estimatedTime,
          riskLevel
        }
      );
    }

    return plan;
  }

  /**
   * Gets specialized system prompt for a specific step
   */
  public getSystemPromptForStep(step: DecisionStep, plan: DecisionPlan, context: DecisionContext): string {
    // Use the new ZapDev system prompt as base
    const systemPromptOptions: SystemPromptOptions = {
      performanceFocus: context.subscriptionType === 'pro',
      includeTeamLead: context.subscriptionType === 'pro',
      allowLongCodeByDefault: step.type === 'code-generation'
    };
    
    const basePrompt = getSystemPrompt(systemPromptOptions);
    const decisionPrompt = this.getDecisionMakingPromptForStep(step, plan, context);
    const specializationPrompt = this.getStepSpecializationPrompt(step, plan, context);
    const contextPrompt = this.getContextualPrompt(context);
    
    return `${basePrompt}\n\n${decisionPrompt}\n\n${specializationPrompt}\n\n${contextPrompt}`;
  }

  /**
   * Gets decision-making prompt for a specific step
   */
  private getDecisionMakingPromptForStep(step: DecisionStep, plan: DecisionPlan, context: DecisionContext): string {
    // Determine if this is a frontend-only task
    const isFrontendOnly = this.isFrontendOnlyTask(context.userQuery, context);
    
    if (isFrontendOnly) {
      return getDecisionMakingPromptNext();
    } else {
      return getDecisionMakingPrompt();
    }
  }

  /**
   * Determines if the task is frontend-only based on context
   */
  private isFrontendOnlyTask(userQuery: string, _context: DecisionContext): boolean {
    const query = userQuery.toLowerCase();
    const frontendKeywords = ['ui', 'component', 'button', 'layout', 'style', 'css', 'react', 'frontend', 'design'];
    const backendKeywords = ['api', 'database', 'server', 'backend', 'sql', 'auth', 'authentication'];
    
    const hasFrontendKeywords = frontendKeywords.some(keyword => query.includes(keyword));
    const hasBackendKeywords = backendKeywords.some(keyword => query.includes(keyword));
    
    // If explicitly mentions backend, use general decision prompt
    if (hasBackendKeywords) return false;
    
    // If mentions frontend or no clear indication, assume frontend-only
    return hasFrontendKeywords || !hasBackendKeywords;
  }

  /**
   * Analyzes task from user query
   */
  private analyzeTask(userQuery: string, context: DecisionContext) {
    const query = userQuery.toLowerCase();
    
    // Determine task type
    let type: TaskContext['type'] = 'code-generation';
    if (query.includes('debug') || query.includes('fix') || query.includes('error')) {
      type = 'debugging';
    } else if (query.includes('explain') || query.includes('how') || query.includes('what')) {
      type = 'explanation';
    } else if (query.includes('optimize') || query.includes('improve') || query.includes('performance')) {
      type = 'optimization';
    } else if (query.includes('database') || query.includes('sql') || query.includes('table')) {
      type = 'database';
    } else if (query.includes('ui') || query.includes('design') || query.includes('layout')) {
      type = 'ui-design';
    } else if (query.includes('analyze') || query.includes('review') || query.includes('audit')) {
      type = 'analysis';
    }

    // Determine complexity
    let complexity: TaskContext['complexity'] = 'medium';
    const complexityIndicators = {
      simple: ['button', 'text', 'color', 'simple', 'basic', 'quick'],
      complex: ['architecture', 'system', 'integration', 'complex', 'advanced', 'enterprise', 'scalable']
    };

    for (const indicator of complexityIndicators.simple) {
      if (query.includes(indicator)) {
        complexity = 'simple';
        break;
      }
    }

    for (const indicator of complexityIndicators.complex) {
      if (query.includes(indicator)) {
        complexity = 'complex';
        break;
      }
    }

    // Additional complexity factors
    if (context.currentFiles && context.currentFiles.length > 10) {
      complexity = 'complex';
    }

    return { type, complexity };
  }

  /**
   * Detects programming language from context
   */
  private detectLanguage(userQuery: string, context: DecisionContext): string | undefined {
    const query = userQuery.toLowerCase();
    const languages = ['typescript', 'javascript', 'python', 'react', 'vue', 'angular', 'html', 'css'];
    
    for (const lang of languages) {
      if (query.includes(lang)) return lang;
    }

    // Check current files
    if (context.currentFiles) {
      const extensions = context.currentFiles.map(f => f.split('.').pop()?.toLowerCase());
      if (extensions.includes('tsx') || extensions.includes('jsx')) return 'react';
      if (extensions.includes('ts')) return 'typescript';
      if (extensions.includes('js')) return 'javascript';
      if (extensions.includes('py')) return 'python';
    }

    return 'typescript'; // default for this project
  }

  /**
   * Detects framework from context
   */
  private detectFramework(userQuery: string, _context: DecisionContext): string | undefined {
    const query = userQuery.toLowerCase();
    const frameworks = ['nextjs', 'react', 'vue', 'angular', 'express', 'fastapi', 'django'];
    
    for (const framework of frameworks) {
      if (query.includes(framework)) return framework;
    }

    return 'nextjs'; // default for this project
  }

  /**
   * Determines execution strategy
   */
  private determineStrategy(
    taskAnalysis: any, 
    _context: DecisionContext, 
    subscriptionType: string
  ): DecisionPlan['strategy'] {
    const { complexity } = taskAnalysis;
    const { urgency = 'medium' } = _context;

    if (urgency === 'high' && complexity === 'simple') {
      return 'direct-implementation';
    }

    if (complexity === 'complex' || subscriptionType === 'pro') {
      return 'analysis-first';
    }

    if (taskAnalysis.type === 'code-generation' && complexity === 'medium') {
      return 'iterative-development';
    }

    return 'multi-stage';
  }

  /**
   * Generates execution steps
   */
  private generateSteps(
    strategy: DecisionPlan['strategy'], 
    _taskAnalysis: any, 
    _context: DecisionContext
  ): DecisionStep[] {
    const steps: DecisionStep[] = [];

    switch (strategy) {
      case 'direct-implementation':
        steps.push({
          id: 'implement',
          type: 'code-generation',
          description: 'Direct implementation of the requested feature',
          estimatedTime: 5,
          priority: 'high'
        });
        break;

      case 'analysis-first':
        steps.push(
          {
            id: 'analyze',
            type: 'analysis',
            description: 'Analyze requirements and current codebase',
            estimatedTime: 10,
            priority: 'high'
          },
          {
            id: 'implement',
            type: 'code-generation',
            description: 'Implement based on analysis',
            estimatedTime: 15,
            priority: 'high',
            dependencies: ['analyze']
          },
          {
            id: 'review',
            type: 'review',
            description: 'Review and optimize implementation',
            estimatedTime: 5,
            priority: 'medium',
            dependencies: ['implement']
          }
        );
        break;

      case 'iterative-development':
        steps.push(
          {
            id: 'prototype',
            type: 'code-generation',
            description: 'Create initial prototype',
            estimatedTime: 8,
            priority: 'high'
          },
          {
            id: 'refine',
            type: 'optimization',
            description: 'Refine and improve implementation',
            estimatedTime: 7,
            priority: 'medium',
            dependencies: ['prototype']
          }
        );
        break;

      case 'multi-stage':
        steps.push(
          {
            id: 'plan',
            type: 'analysis',
            description: 'Create implementation plan',
            estimatedTime: 5,
            priority: 'high'
          },
          {
            id: 'implement-core',
            type: 'code-generation',
            description: 'Implement core functionality',
            estimatedTime: 12,
            priority: 'high',
            dependencies: ['plan']
          },
          {
            id: 'test',
            type: 'testing',
            description: 'Test and validate implementation',
            estimatedTime: 5,
            priority: 'medium',
            dependencies: ['implement-core']
          },
          {
            id: 'optimize',
            type: 'optimization',
            description: 'Optimize and finalize',
            estimatedTime: 3,
            priority: 'low',
            dependencies: ['test']
          }
        );
        break;
    }

    return steps;
  }

  /**
   * Assesses implementation risk
   */
  private assessRisk(taskAnalysis: any, context: DecisionContext): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Complexity risk
    if (taskAnalysis.complexity === 'complex') riskScore += 3;
    else if (taskAnalysis.complexity === 'medium') riskScore += 1;

    // Codebase size risk
    if (context.currentFiles && context.currentFiles.length > 20) riskScore += 2;
    else if (context.currentFiles && context.currentFiles.length > 10) riskScore += 1;

    // Type-specific risks
    if (taskAnalysis.type === 'database') riskScore += 2;
    if (taskAnalysis.type === 'optimization') riskScore += 1;

    if (riskScore >= 5) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Generates reasoning for the plan
   */
  private generateReasoning(
    strategy: DecisionPlan['strategy'],
    taskAnalysis: any,
    recommendedModel: ModelRecommendation,
    context: DecisionContext
  ): string {
    let reasoning = `Selected ${strategy} strategy for ${taskAnalysis.type} task with ${taskAnalysis.complexity} complexity. `;
    reasoning += `Using ${recommendedModel.modelId} (${recommendedModel.reasoning}). `;
    
    if (context.urgency === 'high') {
      reasoning += 'Optimized for speed due to high urgency. ';
    }
    
    if (context.subscriptionType === 'pro') {
      reasoning += 'Enhanced multi-step approach available with Pro subscription. ';
    }

    return reasoning;
  }

  /**
   * Gets chat system prompt for conversational interactions
   */
  public getChatSystemPrompt(): string {
    return CHAT_SYSTEM_PROMPT;
  }

  private getStepSpecializationPrompt(step: DecisionStep, _plan: DecisionPlan, _context: DecisionContext): string {
    switch (step.type) {
      case 'analysis':
        return `Focus on thorough analysis. Examine the codebase structure, identify potential issues, and plan the optimal implementation approach. Consider dependencies, side effects, and integration points.`;
      
      case 'code-generation':
        return `Generate production-ready code. Ensure all imports are correct, follow existing code patterns, and implement comprehensive error handling. Code should be immediately executable.`;
      
      case 'testing':
        return `Focus on testing and validation. Create test cases, validate functionality, and check for edge cases. Ensure code works as expected in different scenarios.`;
      
      case 'optimization':
        return `Optimize for performance, maintainability, and best practices. Refactor code for clarity, improve performance, and ensure scalability.`;
      
      case 'review':
        return `Conduct thorough code review. Check for bugs, security issues, performance problems, and adherence to best practices. Suggest improvements.`;
      
      default:
        return '';
    }
  }

  private getContextualPrompt(context: DecisionContext): string {
    let prompt = '';
    
    if (context.projectType) {
      prompt += `Project type: ${context.projectType}. `;
    }
    
    if (context.userPreferences?.codingStyle) {
      prompt += `Coding style preference: ${context.userPreferences.codingStyle}. `;
    }
    
    if (context.subscriptionType === 'pro') {
      prompt += 'User has Pro subscription - provide enhanced features and detailed explanations. ';
    }

    return prompt;
  }
}
