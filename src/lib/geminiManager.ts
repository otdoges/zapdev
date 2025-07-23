import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import systemPrompt from './systemPrompt';
import type { LanguageModel } from 'ai';

export interface TaskAssignment {
  model: string;
  role: string;
  priority: number;
  reasoning: string;
}

export interface PromptOptimization {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  reasoning: string;
}

class GeminiManager {
  private managerModel: LanguageModel | null = null;
  private promptOptimizerModel: LanguageModel | null = null;
  private quickManagerModel: LanguageModel | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initializeGemini();
  }

  private initializeGemini() {
    try {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      
      if (!apiKey) {
        console.error('[GeminiManager] GOOGLE_GENERATIVE_AI_API_KEY not found - Gemini features disabled');
        this.isEnabled = false;
        return;
      }

      this.managerModel = google('gemini-2.0-flash-exp');
      this.promptOptimizerModel = google('gemini-2.0-flash-exp');
      this.quickManagerModel = google('gemini-2.0-flash-exp');
      this.isEnabled = true;
      
      console.log('[GeminiManager] Gemini API initialized successfully');
    } catch (error) {
      console.error('[GeminiManager] Failed to initialize Gemini API:', error);
      this.isEnabled = false;
    }
  }

  // AI Design Playbook principles for prompt optimization
  private promptOptimizationPrinciples = `
# AI Design Playbook - Prompt Optimization Principles

## Core Principles for Effective AI Prompts

### 1. Clarity and Specificity
- Be explicit about what you want
- Use specific, concrete language
- Avoid ambiguous terms
- Define technical terms when necessary

### 2. Context and Background
- Provide relevant context about the task
- Include background information that affects the output
- Set clear constraints and limitations
- Specify the target audience

### 3. Structure and Organization
- Use clear formatting with headers, bullets, and sections
- Break complex requests into logical steps
- Prioritize information by importance
- Use consistent terminology throughout

### 4. Role and Persona Definition
- Define the AI's role clearly (expert, assistant, critic, etc.)
- Specify expertise level and domain knowledge
- Set appropriate tone and communication style
- Clarify the relationship dynamic

### 5. Output Format Specification
- Clearly specify desired output format
- Include examples when helpful
- Set length requirements or constraints
- Define success criteria

### 6. Iterative Refinement
- Build on previous interactions
- Reference earlier context when relevant
- Allow for follow-up questions
- Encourage clarification requests

### 7. Edge Case Handling
- Anticipate potential misunderstandings
- Provide guidance for uncertain situations
- Include fallback instructions
- Handle error scenarios gracefully

## Optimization Strategies

### For Code Generation:
- Specify programming language and version
- Include relevant libraries and frameworks
- Define coding standards and conventions
- Provide example input/output

### For Creative Tasks:
- Set style and tone preferences
- Provide inspiration or reference materials
- Define creative constraints
- Specify target audience

### For Analysis Tasks:
- Define evaluation criteria
- Specify data sources and reliability
- Set analytical framework
- Request specific insights or conclusions

### For Problem-Solving:
- Clearly define the problem
- List known constraints
- Specify solution requirements
- Include success metrics
`;

  async optimizePrompt(userPrompt: string): Promise<PromptOptimization> {
    if (!this.isEnabled) {
      return {
        originalPrompt: userPrompt,
        optimizedPrompt: userPrompt,
        improvements: ['Gemini optimization service unavailable'],
        reasoning: 'Gemini API key not configured - using original prompt'
      };
    }

    try {
      const result = await generateText({
        model: this.promptOptimizerModel,
        messages: [
          {
            role: 'system',
            content: `You are a prompt optimization expert. Your job is to improve user prompts using the AI Design Playbook principles.

${this.promptOptimizationPrinciples}

Analyze the user's prompt and provide an optimized version that:
1. Maintains the original intent
2. Adds clarity and specificity
3. Improves structure and organization
4. Enhances context where needed
5. Follows best practices for AI interaction

Return your response in JSON format with:
- originalPrompt: the original user prompt
- optimizedPrompt: the improved version
- improvements: array of specific improvements made
- reasoning: explanation of why these changes help`
          },
          {
            role: 'user',
            content: `Please optimize this prompt: "${userPrompt}"`
          }
        ],
        temperature: 0.3,
        maxTokens: 2000,
      });

      try {
        const parsed = JSON.parse(result.text);
        return {
          originalPrompt: userPrompt,
          optimizedPrompt: parsed.optimizedPrompt || userPrompt,
          improvements: parsed.improvements || [],
          reasoning: parsed.reasoning || 'No specific improvements identified'
        };
      } catch (parseError) {
        return {
          originalPrompt: userPrompt,
          optimizedPrompt: userPrompt,
          improvements: ['Failed to parse optimization response'],
          reasoning: 'Prompt optimization failed due to parsing error'
        };
      }
    } catch (error) {
      console.error('Prompt optimization failed:', error);
      return {
        originalPrompt: userPrompt,
        optimizedPrompt: userPrompt,
        improvements: ['Optimization service unavailable'],
        reasoning: 'Prompt optimization service is temporarily unavailable'
      };
    }
  }

  async assignTasks(userPrompt: string, availableModels: string[]): Promise<TaskAssignment[]> {
    if (!this.isEnabled) {
      // Fallback assignment logic when Gemini is disabled
      const isCodeRelated = /code|programming|debug|implement|function|class|api|bug|fix/i.test(userPrompt);
      
      if (isCodeRelated) {
        return [
          {
            model: 'moonshotai/kimi-k2-instruct',
            role: 'primary_code_specialist',
            priority: 10,
            reasoning: 'Code-related request requires Kimi K2 specialist (Gemini unavailable)'
          }
        ];
      } else {
        return [
          {
            model: 'deepseek-r1-distill-llama-70b',
            role: 'primary_general',
            priority: 9,
            reasoning: 'Most capable model for comprehensive responses (Gemini unavailable)'
          }
        ];
      }
    }

    try {
      const result = await generateText({
        model: this.managerModel,
        messages: [
          {
            role: 'system',
            content: `You are an AI Task Manager. Your role is to analyze user requests and assign appropriate AI models to handle different aspects of the task.

Available Models:
- deepseek-r1-distill-llama-70b: Most capable 70B model with 131k context window, excellent for complex reasoning and comprehensive responses
- qwen/qwen3-32b: High-quality 32B model with 131k context, great for detailed analysis and long-form content
- mistral-saba-24b: Advanced reasoning model with 32k context, specialized in logical thinking and problem-solving
- moonshotai/kimi-k2-instruct: CODE SPECIALIST - This model has ultimate authority over code-related tasks and can overrule any other model's code decisions

Task Assignment Rules:
1. For code generation/debugging: ALWAYS assign moonshotai/kimi-k2-instruct as primary
2. For complex reasoning/analysis: Use deepseek-r1-distill-llama-70b (most capable)
3. For detailed content/long-form: Use qwen/qwen3-32b (high context capacity)
4. For logical reasoning/math: Use mistral-saba-24b (reasoning specialist)
5. For comprehensive responses: Use deepseek-r1-distill-llama-70b as primary
6. IMPORTANT: kimi-k2 has final say on all code-related decisions

Return a JSON array of task assignments with:
- model: the model to use
- role: specific role for this model (primary, secondary, specialist, etc.)
- priority: 1-10 (10 being highest)
- reasoning: why this model is chosen

${systemPrompt}`
          },
          {
            role: 'user',
            content: `Analyze this request and assign appropriate models: "${userPrompt}"`
          }
        ],
        temperature: 0.2,
        maxTokens: 1000,
      });

      try {
        const parsed = JSON.parse(result.text);
        return Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        // Fallback assignment
        const isCodeRelated = /code|programming|debug|implement|function|class|api|bug|fix/i.test(userPrompt);
        
        if (isCodeRelated) {
          return [
            {
              model: 'moonshotai/kimi-k2-instruct',
              role: 'primary_code_specialist',
              priority: 10,
              reasoning: 'Code-related request requires Kimi K2 specialist'
            }
          ];
        } else {
          return [
            {
              model: 'deepseek-r1-distill-llama-70b',
              role: 'primary_general',
              priority: 9,
              reasoning: 'Most capable preview model for comprehensive responses'
            }
          ];
        }
      }
    } catch (error) {
      console.error('Task assignment failed:', error);
      // Emergency fallback
      return [
        {
          model: 'deepseek-r1-distill-llama-70b',
          role: 'fallback_primary',
          priority: 7,
          reasoning: 'Fallback assignment due to manager failure - using most capable model'
        }
      ];
    }
  }

  async coordinateResponse(
    userPrompt: string,
    modelResponses: { model: string; response: string; role: string }[]
  ): Promise<string> {
    // Check if Kimi K2 provided a response for code-related tasks
    const kimiResponse = modelResponses.find(r => r.model === 'moonshotai/kimi-k2-instruct');
    const isCodeRelated = /code|programming|debug|implement|function|class|api|bug|fix/i.test(userPrompt);
    
    if (isCodeRelated && kimiResponse) {
      // Kimi K2 has final authority on code - use its response
      return kimiResponse.response;
    }

    if (!this.isEnabled) {
      // Simple fallback coordination when Gemini is disabled
      const sortedResponses = modelResponses.sort((a, b) => {
        if (a.model === 'moonshotai/kimi-k2-instruct') return -1;
        if (b.model === 'moonshotai/kimi-k2-instruct') return 1;
        if (a.model === 'deepseek-r1-distill-llama-70b') return -1;
        if (b.model === 'deepseek-r1-distill-llama-70b') return 1;
        return 0;
      });
      return sortedResponses[0]?.response || 'I apologize, but I encountered an error processing your request.';
    }

    try {
      // For non-code tasks or when kimi-k2 didn't respond, coordinate responses
      const result = await generateText({
        model: this.quickManagerModel,
        messages: [
          {
            role: 'system',
            content: `You are a response coordinator. Your job is to synthesize multiple AI model responses into a single, coherent answer.

Rules:
1. If kimi-k2 responded to a code-related query, prioritize its response
2. Combine the best elements from all responses
3. Resolve any conflicts between responses
4. Maintain consistency with the user's original request
5. Provide a clear, actionable response

Original user prompt: "${userPrompt}"

Model responses to coordinate:
${modelResponses.map(r => `${r.model} (${r.role}): ${r.response}`).join('\n\n')}`
          },
          {
            role: 'user',
            content: 'Please provide a coordinated response that addresses the user\'s request.'
          }
        ],
        temperature: 0.4,
        maxTokens: 3000,
      });

      return result.text;
    } catch (error) {
      console.error('Response coordination failed:', error);
      // Return the highest priority response as fallback
      const sortedResponses = modelResponses.sort((a, b) => {
        if (a.model === 'kimi-k2') return -1;
        if (b.model === 'kimi-k2') return 1;
        return 0;
      });
      return sortedResponses[0]?.response || 'I apologize, but I encountered an error processing your request.';
    }
  }
}

export const geminiManager = new GeminiManager();
export default geminiManager;