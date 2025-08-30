import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// Initialize Gemini Flash for prompt optimization
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export type OptimizationLevel = 'light' | 'moderate' | 'comprehensive';

export type PromptOptimizationRequest = {
  originalPrompt: string;
  targetTask: string;
  context?: {
    userLevel?: 'beginner' | 'intermediate' | 'expert';
    previousAttempts?: string[];
    desiredOutcome?: string;
    constraints?: string[];
  };
  optimizationLevel: OptimizationLevel;
};

export type PromptOptimizationResult = {
  optimizedPrompt: string;
  improvements: string[];
  reasoning: string;
  confidence: number;
  estimatedEffectiveness: 'low' | 'medium' | 'high';
  alternatives?: string[];
};

const optimizationResultSchema = z.object({
  optimizedPrompt: z.string().describe('The enhanced and optimized version of the prompt'),
  improvements: z.array(z.string()).describe('List of specific improvements made'),
  reasoning: z.string().describe('Explanation of why these changes improve the prompt'),
  confidence: z.number().min(0).max(1).describe('Confidence score for the optimization (0-1)'),
  estimatedEffectiveness: z.enum(['low', 'medium', 'high']).describe('Expected effectiveness of the optimized prompt'),
  alternatives: z.array(z.string()).optional().describe('Alternative prompt variations')
});

export class PromptOptimizer {
  private static instance: PromptOptimizer;
  
  public static getInstance(): PromptOptimizer {
    if (!PromptOptimizer.instance) {
      PromptOptimizer.instance = new PromptOptimizer();
    }
    return PromptOptimizer.instance;
  }

  /**
   * Optimizes a prompt using Gemini Flash 2.5
   */
  public async optimizePrompt(request: PromptOptimizationRequest): Promise<PromptOptimizationResult> {
    const { originalPrompt, targetTask, context = {}, optimizationLevel } = request;

    try {
      const systemPrompt = this.buildOptimizationSystemPrompt(optimizationLevel);
      const userPrompt = this.buildUserPrompt(originalPrompt, targetTask, context);

      const result = await generateObject({
        model: google('gemini-2.0-flash-exp'),
        schema: optimizationResultSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3 // Lower temperature for more consistent optimization
      });

      return result.object;
    } catch (error) {
      console.error('Prompt optimization failed:', error);
      // Fallback to basic optimization
      return this.basicOptimization(originalPrompt, targetTask);
    }
  }

  /**
   * Optimizes multiple prompts in batch
   */
  public async optimizePromptBatch(requests: PromptOptimizationRequest[]): Promise<PromptOptimizationResult[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.optimizePrompt(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch optimization failed for prompt ${index}:`, result.reason);
        return this.basicOptimization(requests[index].originalPrompt, requests[index].targetTask);
      }
    });
  }

  /**
   * Creates an enhanced system prompt based on user input
   */
  public async enhanceSystemPrompt(
    basePrompt: string, 
    taskType: string, 
    specificRequirements?: string[]
  ): Promise<string> {
    try {
      const enhancementPrompt = `
Enhance this system prompt for ${taskType} tasks:

BASE PROMPT:
${basePrompt}

SPECIFIC REQUIREMENTS:
${specificRequirements ? specificRequirements.join('\n- ') : 'None specified'}

Make the prompt:
1. More specific and actionable
2. Include relevant constraints and guidelines  
3. Add examples where helpful
4. Ensure clarity and comprehensiveness
5. Optimize for the specific task type

Return only the enhanced system prompt, no explanations.`;

      const result = await generateText({
        model: google('gemini-2.0-flash-exp'),
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert prompt engineer. Enhance system prompts to be more effective and specific.'
          },
          { role: 'user', content: enhancementPrompt }
        ],
        temperature: 0.4
      });

      return result.text.trim();
    } catch (error) {
      console.error('System prompt enhancement failed:', error);
      return basePrompt; // Return original if enhancement fails
    }
  }

  /**
   * Analyzes a prompt for potential issues
   */
  public async analyzePrompt(prompt: string): Promise<{
    issues: string[];
    suggestions: string[];
    score: number;
  }> {
    try {
      const analysisSchema = z.object({
        issues: z.array(z.string()).describe('Identified issues with the prompt'),
        suggestions: z.array(z.string()).describe('Suggestions for improvement'),
        score: z.number().min(0).max(100).describe('Overall prompt quality score (0-100)')
      });

      const result = await generateObject({
        model: google('gemini-2.0-flash-exp'),
        schema: analysisSchema,
        messages: [
          {
            role: 'system',
            content: `You are a prompt analysis expert. Analyze prompts for:
- Clarity and specificity
- Completeness of instructions
- Potential ambiguities
- Missing context or constraints
- Overall effectiveness

Provide constructive feedback and actionable suggestions.`
          },
          {
            role: 'user',
            content: `Analyze this prompt:\n\n${prompt}`
          }
        ],
        temperature: 0.2
      });

      return result.object;
    } catch (error) {
      console.error('Prompt analysis failed:', error);
      return {
        issues: ['Analysis failed'],
        suggestions: ['Could not analyze prompt'],
        score: 50
      };
    }
  }

  private buildOptimizationSystemPrompt(level: OptimizationLevel): string {
    const basePrompt = `You are an expert prompt engineer specializing in optimizing AI prompts for maximum effectiveness. Your goal is to improve prompts while maintaining their core intent.`;

    const levelSpecificInstructions = {
      light: `
Make light improvements focusing on:
- Clarity and readability
- Removing ambiguity
- Adding essential context
- Basic structure improvements`,

      moderate: `
Make moderate improvements focusing on:
- Enhanced structure and organization
- Better specificity and constraints
- Improved examples and guidance
- More effective instruction format
- Context enrichment`,

      comprehensive: `
Make comprehensive improvements focusing on:
- Complete prompt restructuring if needed
- Advanced prompt engineering techniques
- Multiple optimization strategies
- Detailed examples and edge cases
- Complex constraint handling
- Multi-step instruction breakdown`
    };

    return `${basePrompt}\n\n${levelSpecificInstructions[level]}\n\nAlways maintain the original intent while making the prompt more effective.`;
  }

  private buildUserPrompt(
    originalPrompt: string, 
    targetTask: string, 
    context: any
  ): string {
    let prompt = `
ORIGINAL PROMPT:
${originalPrompt}

TARGET TASK: ${targetTask}
`;

    if (context.userLevel) {
      prompt += `\nUSER LEVEL: ${context.userLevel}`;
    }

    if (context.desiredOutcome) {
      prompt += `\nDESIRED OUTCOME: ${context.desiredOutcome}`;
    }

    if (context.constraints && context.constraints.length > 0) {
      prompt += `\nCONSTRAINTS:\n- ${context.constraints.join('\n- ')}`;
    }

    if (context.previousAttempts && context.previousAttempts.length > 0) {
      prompt += `\nPREVIOUS ATTEMPTS (that didn't work well):\n${context.previousAttempts.join('\n\n')}`;
    }

    prompt += `\n\nPlease optimize this prompt to be more effective for the target task while considering the context provided.`;

    return prompt;
  }

  private basicOptimization(originalPrompt: string, targetTask: string): PromptOptimizationResult {
    // Simple fallback optimization logic
    const improvements = [
      'Added task-specific context',
      'Improved instruction clarity',
      'Enhanced structure'
    ];

    const optimizedPrompt = `For ${targetTask}:\n\n${originalPrompt}\n\nPlease ensure your response is comprehensive and addresses all aspects of this request.`;

    return {
      optimizedPrompt,
      improvements,
      reasoning: 'Applied basic optimization patterns due to AI service unavailability',
      confidence: 0.6,
      estimatedEffectiveness: 'medium' as const
    };
  }
}

// Export singleton instance
export const promptOptimizer = PromptOptimizer.getInstance();