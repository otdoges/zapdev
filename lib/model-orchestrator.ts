import { appConfig } from '@/config/app.config';

export type TaskType = 
  | 'code-generation' 
  | 'security-review' 
  | 'architecture-planning' 
  | 'prompt-optimization'
  | 'comprehensive-analysis'
  | 'decision-making'
  | 'creative-enhancement'
  | 'fast-iteration';

export type TaskComplexity = 'simple' | 'medium' | 'complex';

export type TaskRequirements = {
  type: TaskType;
  complexity: TaskComplexity;
  priority: 'speed' | 'quality' | 'security' | 'creativity';
  context?: {
    hasCodeReview?: boolean;
    requiresMultistep?: boolean;
    isSecurityCritical?: boolean;
    needsOptimization?: boolean;
  };
};

export type ModelRecommendation = {
  primaryModel: string;
  fallbackModel?: string;
  reasoning: string;
  confidence: number;
  estimatedSpeed: 'fast' | 'medium' | 'slow';
  estimatedCost: 'low' | 'medium' | 'high';
};

export class ModelOrchestrator {
  private static instance: ModelOrchestrator;
  
  public static getInstance(): ModelOrchestrator {
    if (!ModelOrchestrator.instance) {
      ModelOrchestrator.instance = new ModelOrchestrator();
    }
    return ModelOrchestrator.instance;
  }

  /**
   * Analyzes a task and recommends the best AI model to use
   */
  public recommendModel(requirements: TaskRequirements): ModelRecommendation {
    const { type, complexity, priority, context = {} } = requirements;
    
    // Prompt optimization goes to Gemini Flash 2.5
    if (type === 'prompt-optimization' || context.needsOptimization) {
      return {
        primaryModel: 'google/gemini-2.5-flash',
        reasoning: 'Prompt optimization using Gemini 2.5 Flash Lite for enhancement',
        confidence: 0.90,
        estimatedSpeed: 'fast',
        estimatedCost: 'low'
      };
    }

    // All other tasks use Kimi K2 with specialized system prompts
    return {
      primaryModel: 'moonshotai/kimi-k2-instruct',
      reasoning: 'Using Kimi K2 with specialized system prompt for ' + type,
      confidence: 0.85,
      estimatedSpeed: 'fast',
      estimatedCost: 'low'
    };
  }
  
  /**
   * Gets the specialized system prompt for a task type
   */
  public getSystemPrompt(taskType: TaskType): string {
    const basePrompts = {
      'code-generation': `You are an expert software developer specializing in clean, efficient code generation. Focus on:
- Writing production-ready, well-structured code
- Following best practices and design patterns
- Implementing robust error handling
- Creating maintainable and scalable solutions
- Using modern frameworks and libraries effectively`,

      'security-review': `You are a cybersecurity expert reviewing code for vulnerabilities and security best practices. Focus on:
- Identifying security vulnerabilities (XSS, SQL injection, CSRF, etc.)
- Reviewing authentication and authorization mechanisms  
- Checking input validation and sanitization
- Ensuring secure data handling and storage
- Recommending security improvements and fixes`,

      'architecture-planning': `You are a senior system architect designing scalable, maintainable solutions. Focus on:
- Creating well-structured system architectures
- Designing for scalability and performance
- Planning component interactions and dependencies
- Considering maintainability and extensibility
- Balancing trade-offs and making informed decisions`,

      'decision-making': `You are a technical decision maker evaluating options and trade-offs. Focus on:
- Analyzing pros and cons of different approaches
- Considering technical constraints and requirements
- Evaluating performance, cost, and complexity impacts
- Making data-driven recommendations
- Explaining reasoning behind decisions`,

      'comprehensive-analysis': `You are a comprehensive technical analyst providing detailed insights. Focus on:
- Thorough analysis of complex systems and requirements
- Identifying patterns, issues, and opportunities
- Providing detailed explanations and documentation
- Considering multiple perspectives and use cases
- Delivering actionable insights and recommendations`,

      'prompt-optimization': `You are a prompt engineering expert optimizing AI interactions. Focus on:
- Analyzing existing prompts for clarity and effectiveness
- Improving prompt structure and specificity
- Adding relevant context and constraints
- Optimizing for better AI responses
- Creating clear, actionable instructions`,

      'creative-enhancement': `You are a creative technologist enhancing solutions with innovation. Focus on:
- Adding creative and innovative elements
- Improving user experience and design
- Suggesting modern, engaging approaches
- Balancing creativity with functionality
- Creating visually appealing and intuitive solutions`,

      'fast-iteration': `You are focused on rapid development and quick iterations. Focus on:
- Delivering working solutions quickly
- Prioritizing essential features and functionality
- Using efficient development patterns
- Minimizing complexity while maintaining quality
- Getting to MVP as fast as possible`
    };

    return basePrompts[taskType] || basePrompts['code-generation'];
  }

  /**
   * Analyzes user input to determine task requirements
   */
  public analyzeTask(userPrompt: string, context?: any): TaskRequirements {
    const prompt = userPrompt.toLowerCase();
    
    // Security keywords
    if (this.containsSecurityKeywords(prompt)) {
      return {
        type: 'security-review',
        complexity: 'medium',
        priority: 'security',
        context: { isSecurityCritical: true }
      };
    }
    
    // Architecture keywords
    if (this.containsArchitectureKeywords(prompt)) {
      return {
        type: 'architecture-planning',
        complexity: 'complex',
        priority: 'quality',
        context: { requiresMultistep: true }
      };
    }
    
    // Prompt optimization keywords
    if (this.containsOptimizationKeywords(prompt)) {
      return {
        type: 'prompt-optimization',
        complexity: 'medium',
        priority: 'creativity',
        context: { needsOptimization: true }
      };
    }
    
    // Code generation (default for most requests)
    const complexity = this.assessComplexity(prompt);
    const priority = this.determinePriority(prompt);
    
    return {
      type: 'code-generation',
      complexity,
      priority,
      context: {
        hasCodeReview: context?.isEdit || false,
        requiresMultistep: complexity === 'complex'
      }
    };
  }
  
  /**
   * Gets model capabilities for display purposes
   */
  public getModelCapabilities(modelId: string) {
    return (appConfig.ai.modelCapabilities as Record<string, any>)[modelId] || null;
  }
  
  /**
   * Gets all available models with their capabilities
   */
  public getAllModelsWithCapabilities() {
    return appConfig.ai.availableModels.map(modelId => ({
      id: modelId,
      displayName: (appConfig.ai.modelDisplayNames as Record<string, string>)[modelId] || modelId,
      capabilities: this.getModelCapabilities(modelId)
    }));
  }

  private containsSecurityKeywords(prompt: string): boolean {
    const securityKeywords = [
      'security', 'vulnerability', 'exploit', 'attack', 'sanitize', 'validate',
      'authenticate', 'authorize', 'permission', 'secure', 'review code',
      'audit', 'compliance', 'penetration', 'xss', 'sql injection', 'csrf'
    ];
    return securityKeywords.some(keyword => prompt.includes(keyword));
  }
  
  private containsArchitectureKeywords(prompt: string): boolean {
    const architectureKeywords = [
      'architecture', 'system design', 'scalable', 'microservices', 'database design',
      'infrastructure', 'deployment', 'performance', 'optimization', 'refactor',
      'design pattern', 'structure', 'organize', 'modular', 'framework'
    ];
    return architectureKeywords.some(keyword => prompt.includes(keyword));
  }
  
  private containsOptimizationKeywords(prompt: string): boolean {
    const optimizationKeywords = [
      'improve prompt', 'optimize prompt', 'better prompt', 'enhance',
      'make better', 'improve quality', 'more effective', 'refine'
    ];
    return optimizationKeywords.some(keyword => prompt.includes(keyword));
  }
  
  private assessComplexity(prompt: string): TaskComplexity {
    const complexityIndicators = {
      simple: ['simple', 'basic', 'quick', 'small', 'minor'],
      medium: ['moderate', 'standard', 'typical', 'normal'],
      complex: ['complex', 'advanced', 'comprehensive', 'full', 'complete', 
               'multiple', 'system', 'entire', 'whole', 'all']
    };
    
    let score = 0;
    
    // Check for complexity indicators
    complexityIndicators.complex.forEach(word => {
      if (prompt.includes(word)) score += 2;
    });
    
    complexityIndicators.medium.forEach(word => {
      if (prompt.includes(word)) score += 1;
    });
    
    // Length also indicates complexity
    if (prompt.length > 200) score += 1;
    if (prompt.length > 500) score += 2;
    
    // Multiple requirements indicate complexity
    const requirements = prompt.split(/and|also|plus|additionally|furthermore/).length;
    if (requirements > 2) score += 1;
    if (requirements > 4) score += 2;
    
    if (score >= 3) return 'complex';
    if (score >= 1) return 'medium';
    return 'simple';
  }
  
  private determinePriority(prompt: string): 'speed' | 'quality' | 'security' | 'creativity' {
    const priorityKeywords = {
      speed: ['fast', 'quick', 'rapidly', 'immediately', 'urgent', 'asap'],
      quality: ['best', 'high quality', 'perfect', 'excellent', 'robust', 'reliable'],
      security: ['secure', 'safe', 'protected', 'validated', 'authenticated'],
      creativity: ['creative', 'innovative', 'unique', 'original', 'beautiful', 'modern']
    };
    
    let maxScore = 0;
    let selectedPriority: 'speed' | 'quality' | 'security' | 'creativity' = 'quality';
    
    Object.entries(priorityKeywords).forEach(([priority, keywords]) => {
      const score = keywords.reduce((acc, keyword) => 
        acc + (prompt.includes(keyword) ? 1 : 0), 0
      );
      if (score > maxScore) {
        maxScore = score;
        selectedPriority = priority as 'speed' | 'quality' | 'security' | 'creativity';
      }
    });
    
    return selectedPriority;
  }
}

// Export singleton instance
export const modelOrchestrator = ModelOrchestrator.getInstance();