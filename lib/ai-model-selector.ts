import { appConfig } from '@/config/app.config';

export interface ModelCapabilities {
  codeGeneration: number; // 0-100 score
  reasoning: number; // 0-100 score
  speed: 'fast' | 'medium' | 'slow';
  costLevel: 'low' | 'medium' | 'high';
  contextWindow: number; // tokens
  maxOutputTokens: number;
  supportedLanguages: string[];
  specialties: string[];
  bestFor: string[];
  limitations: string[];
}

export interface TaskContext {
  type: 'code-generation' | 'debugging' | 'explanation' | 'optimization' | 'database' | 'ui-design' | 'analysis';
  complexity: 'simple' | 'medium' | 'complex';
  priority: 'low' | 'normal' | 'high';
  language?: string;
  framework?: string;
  timeConstraint?: 'none' | 'fast' | 'immediate';
  qualityPreference?: 'speed' | 'balanced' | 'quality';
}

export interface ModelRecommendation {
  modelId: string;
  confidence: number; // 0-1
  reasoning: string;
  expectedPerformance: {
    speed: 'fast' | 'medium' | 'slow';
    quality: 'good' | 'very-good' | 'excellent';
    cost: 'low' | 'medium' | 'high';
  };
  alternatives?: string[];
}

// Model capabilities database
const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'moonshotai/kimi-k2-instruct': {
    codeGeneration: 85,
    reasoning: 88,
    speed: 'fast',
    costLevel: 'low',
    contextWindow: 128000,
    maxOutputTokens: 8000,
    supportedLanguages: ['typescript', 'javascript', 'python', 'react', 'nextjs', 'html', 'css'],
    specialties: ['code-generation', 'debugging', 'optimization', 'react-development'],
    bestFor: [
      'Full-stack web development',
      'React/Next.js applications', 
      'Database operations',
      'API development',
      'Code refactoring'
    ],
    limitations: [
      'May be less optimal for very complex reasoning tasks',
      'Limited knowledge of newest frameworks'
    ]
  },
  'google/gemini-2.5-flash': {
    codeGeneration: 78,
    reasoning: 92,
    speed: 'fast',
    costLevel: 'low',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportedLanguages: ['typescript', 'javascript', 'python', 'react', 'nextjs', 'html', 'css', 'sql'],
    specialties: ['reasoning', 'analysis', 'optimization', 'prompt-enhancement'],
    bestFor: [
      'Complex problem analysis',
      'Code optimization',
      'Architectural decisions',
      'Prompt enhancement',
      'Large context analysis'
    ],
    limitations: [
      'May be slower for simple code generation',
      'Sometimes over-engineers simple solutions'
    ]
  }
};

export class AIModelSelector {
  private static instance: AIModelSelector;

  public static getInstance(): AIModelSelector {
    if (!AIModelSelector.instance) {
      AIModelSelector.instance = new AIModelSelector();
    }
    return AIModelSelector.instance;
  }

  /**
   * Recommends the best model for a given task context
   */
  public recommendModel(context: TaskContext): ModelRecommendation {
    const { type, complexity, priority, language, framework, timeConstraint, qualityPreference } = context;

    // Score each available model
    const scores = appConfig.ai.availableModels.map(modelId => {
      const capabilities = MODEL_CAPABILITIES[modelId];
      if (!capabilities) return { modelId, score: 0 };

      let score = 0;
      
      // Base capability scoring
      if (type === 'code-generation') {
        score += capabilities.codeGeneration * 0.4;
      } else if (type === 'analysis' || type === 'optimization') {
        score += capabilities.reasoning * 0.4;
      } else {
        score += (capabilities.codeGeneration + capabilities.reasoning) * 0.2;
      }

      // Language/framework fit
      if (language && capabilities.supportedLanguages.includes(language)) {
        score += 15;
      }
      if (framework && capabilities.supportedLanguages.includes(framework)) {
        score += 10;
      }

      // Complexity matching
      if (complexity === 'simple' && capabilities.speed === 'fast') {
        score += 10;
      } else if (complexity === 'complex' && capabilities.reasoning > 85) {
        score += 15;
      }

      // Time constraint preferences
      if (timeConstraint === 'fast' || timeConstraint === 'immediate') {
        if (capabilities.speed === 'fast') score += 15;
        else if (capabilities.speed === 'medium') score += 5;
      }

      // Quality preference
      if (qualityPreference === 'speed' && capabilities.speed === 'fast') {
        score += 10;
      } else if (qualityPreference === 'quality' && capabilities.reasoning > 85) {
        score += 10;
      }

      // Priority adjustments
      if (priority === 'high') {
        if (capabilities.speed === 'fast') score += 5;
      }

      // Specialty bonuses
      if (capabilities.specialties.includes(type)) {
        score += 20;
      }

      return { modelId, score };
    });

    // Get the best model
    const bestModel = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    const capabilities = MODEL_CAPABILITIES[bestModel.modelId];
    const confidence = Math.min(bestModel.score / 100, 1);

    return {
      modelId: bestModel.modelId,
      confidence,
      reasoning: this.generateReasoning(bestModel.modelId, context, capabilities),
      expectedPerformance: {
        speed: capabilities.speed,
        quality: this.getQualityRating(capabilities),
        cost: capabilities.costLevel
      },
      alternatives: scores
        .filter(s => s.modelId !== bestModel.modelId)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(s => s.modelId)
    };
  }

  /**
   * Gets capabilities for a specific model
   */
  public getModelCapabilities(modelId: string): ModelCapabilities | null {
    return MODEL_CAPABILITIES[modelId] || null;
  }

  /**
   * Gets all available models with their capabilities
   */
  public getAllModelCapabilities(): Record<string, ModelCapabilities> {
    return MODEL_CAPABILITIES;
  }

  private generateReasoning(modelId: string, context: TaskContext, capabilities: ModelCapabilities): string {
    const modelName = appConfig.ai.modelDisplayNames[modelId] || modelId;
    
    let reasoning = `${modelName} selected for ${context.type}`;
    
    if (context.complexity === 'complex' && capabilities.reasoning > 85) {
      reasoning += ' due to superior reasoning capabilities for complex tasks';
    } else if (context.timeConstraint === 'fast' && capabilities.speed === 'fast') {
      reasoning += ' due to fast response times for urgent requests';
    } else if (capabilities.specialties.includes(context.type)) {
      reasoning += ` due to specialization in ${context.type}`;
    }

    if (context.language && capabilities.supportedLanguages.includes(context.language)) {
      reasoning += ` with strong ${context.language} support`;
    }

    return reasoning;
  }

  private getQualityRating(capabilities: ModelCapabilities): 'good' | 'very-good' | 'excellent' {
    const avgScore = (capabilities.codeGeneration + capabilities.reasoning) / 2;
    if (avgScore >= 90) return 'excellent';
    if (avgScore >= 80) return 'very-good';
    return 'good';
  }
}
