import { AIModelSelector, TaskContext } from './ai-model-selector';
import { DecisionPromptSystem, DecisionContext, DecisionPlan } from './decision-prompt-system';
import { trackAIAgentUsage, trackFeatureUsage } from './posthog';

export interface AIRequest {
  userQuery: string;
  userId?: string;
  codebaseContext?: string;
  currentFiles?: string[];
  subscriptionType?: 'free' | 'pro' | 'enterprise';
  urgency?: 'low' | 'medium' | 'high';
  projectType?: 'web-app' | 'api' | 'mobile' | 'desktop' | 'library';
}

export interface AIResponse {
  plan: DecisionPlan;
  selectedModel: string;
  systemPrompt: string;
  confidence: number;
  estimatedTime: number;
  steps: string[];
}

export class IntegratedAISystem {
  private static instance: IntegratedAISystem;
  private modelSelector: AIModelSelector;
  private decisionSystem: DecisionPromptSystem;

  constructor() {
    this.modelSelector = AIModelSelector.getInstance();
    this.decisionSystem = DecisionPromptSystem.getInstance();
  }

  public static getInstance(): IntegratedAISystem {
    if (!IntegratedAISystem.instance) {
      IntegratedAISystem.instance = new IntegratedAISystem();
    }
    return IntegratedAISystem.instance;
  }

  /**
   * Processes an AI request and returns optimized plan with model selection
   */
  public async processRequest(request: AIRequest): Promise<AIResponse> {
    const { userQuery, userId, codebaseContext, currentFiles, subscriptionType = 'free', urgency = 'medium', projectType = 'web-app' } = request;

    // Create decision context
    const decisionContext: DecisionContext = {
      userQuery,
      codebaseContext,
      currentFiles,
      projectType,
      urgency,
      subscriptionType,
      userPreferences: {
        preferredLanguages: ['typescript', 'javascript', 'react'],
        codingStyle: subscriptionType === 'pro' ? 'modern' : 'minimal',
        riskTolerance: 'moderate'
      }
    };

    // Generate decision plan
    const plan = await this.decisionSystem.createDecisionPlan(decisionContext);

    // Get system prompt for the first step
    const firstStep = plan.steps[0];
    const systemPrompt = this.decisionSystem.getSystemPromptForStep(firstStep, plan, decisionContext);

    // Track usage
    if (userId) {
      trackAIAgentUsage(userId, 'integrated-system', 'request-processed');
      trackFeatureUsage(userId, 'ai-model-selector', subscriptionType === 'pro', {
        selectedModel: plan.recommendedModel.modelId,
        strategy: plan.strategy,
        complexity: plan.complexity
      });
    }

    return {
      plan,
      selectedModel: plan.recommendedModel.modelId,
      systemPrompt,
      confidence: plan.recommendedModel.confidence,
      estimatedTime: plan.estimatedTime,
      steps: plan.steps.map(step => step.description)
    };
  }

  /**
   * Gets specialized system prompt for a specific step
   */
  public getStepPrompt(plan: DecisionPlan, stepId: string, context: DecisionContext): string {
    const step = plan.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in plan`);
    }
    
    return this.decisionSystem.getSystemPromptForStep(step, plan, context);
  }

  /**
   * Validates if a model is suitable for a task
   */
  public validateModelForTask(modelId: string, taskContext: TaskContext): boolean {
    const capabilities = this.modelSelector.getModelCapabilities(modelId);
    if (!capabilities) return false;

    // Basic validation rules
    if (taskContext.complexity === 'complex' && capabilities.reasoning < 80) {
      return false;
    }

    if (taskContext.timeConstraint === 'fast' && capabilities.speed !== 'fast') {
      return false;
    }

    return true;
  }

  /**
   * Gets performance metrics for monitoring
   */
  public getPerformanceMetrics(): {
    modelUsage: Record<string, number>;
    strategyUsage: Record<string, number>;
    averageConfidence: number;
  } {
    // In a real implementation, this would track metrics over time
    // For now, return mock data
    return {
      modelUsage: {
        'moonshotai/kimi-k2-instruct': 75,
        'google/gemini-2.5-flash': 25
      },
      strategyUsage: {
        'direct-implementation': 40,
        'analysis-first': 30,
        'iterative-development': 20,
        'multi-stage': 10
      },
      averageConfidence: 0.85
    };
  }
}
