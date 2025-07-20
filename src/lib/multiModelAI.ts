import { groq } from '@ai-sdk/groq';
import { streamText, generateText } from 'ai';
import { getAllModels, type GroqModelId } from './groq';
import systemPrompt from './systemPrompt';
import { geminiManager, type TaskAssignment } from './geminiManager';
import { kimiK2, type KimiK2Response } from './kimiK2';

interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  includeReasoning?: boolean;
}
export interface MultiModelResponse {
  content: string;
  model: string;
  confidence: number;
  reasoning?: string;
  role?: string;
  hasOverride?: boolean;
}

export interface AggregatedResponse {
  finalResponse: string;
  individualResponses: MultiModelResponse[];
  aggregationMethod: 'consensus' | 'best_confidence' | 'longest' | 'reasoning_enhanced' | 'kimi_override' | 'manager_coordinated';
  taskAssignments?: TaskAssignment[];
  promptOptimization?: {
    wasOptimized: boolean;
    improvements: string[];
  };
}

// Primary models to use for multi-model responses - Using best preview models
const MULTI_MODEL_CONFIG = {
  primary: 'deepseek-r1-distill-llama-70b' as GroqModelId, // Most capable 70B model with 131k context
  secondary: 'qwen/qwen3-32b' as GroqModelId, // High-quality 32B model with 131k context
  reasoning: 'mistral-saba-24b' as GroqModelId, // Mistral's advanced reasoning model
  specialist: 'moonshotai/kimi-k2-instruct' as GroqModelId, // Kimi K2 for code specialization
};

class MultiModelAI {
  private models: GroqModelId[];
  private useHierarchicalSystem: boolean = true;

  constructor() {
    // Use the best preview models directly
    this.models = [
      MULTI_MODEL_CONFIG.primary,
      MULTI_MODEL_CONFIG.secondary, 
      MULTI_MODEL_CONFIG.reasoning,
      MULTI_MODEL_CONFIG.specialist,
    ];
  }

  async generateMultiModelResponse(
    messages: any[],
    options: {
      temperature?: number;
      maxTokens?: number;
      includeReasoning?: boolean;
      useOptimization?: boolean;
    } = {}
  ): Promise<AggregatedResponse> {
    const { temperature = 0.7, maxTokens = 4000, includeReasoning = true, useOptimization = true } = options;
    
    if (!this.useHierarchicalSystem) {
      return this.generateLegacyMultiModelResponse(messages, options);
    }

    const userPrompt = messages[messages.length - 1]?.content || '';
    
    // Step 1: Optimize the prompt using Gemini 2.0 Flash
    let optimizedPrompt = userPrompt;
    let promptOptimization = { wasOptimized: false, improvements: [] as string[] };
    
    if (useOptimization) {
      try {
        const optimization = await geminiManager.optimizePrompt(userPrompt);
        optimizedPrompt = optimization.optimizedPrompt;
        promptOptimization = {
          wasOptimized: optimization.optimizedPrompt !== userPrompt,
          improvements: optimization.improvements
        };
      } catch (error) {
        console.error('Prompt optimization failed:', error);
      }
    }

    // Step 2: Get task assignments from Gemini manager
    const taskAssignments = await geminiManager.assignTasks(optimizedPrompt, [
      ...this.models,
      'kimi-k2'
    ]);

    // Step 3: Execute tasks with assigned models
    const modelResponses = await Promise.all(
      taskAssignments.map(async (assignment) => {
        try {
          if (assignment.model === 'kimi-k2') {
            return await this.executeKimiK2Task(optimizedPrompt, assignment);
          } else {
            return await this.executeGroqTask(optimizedPrompt, messages, assignment, temperature, maxTokens);
          }
        } catch (error) {
          console.error(`Task execution failed for ${assignment.model}:`, error);
          return {
            content: '',
            model: assignment.model,
            confidence: 0,
            role: assignment.role,
            hasOverride: false,
          } as MultiModelResponse;
        }
      })
    );

    const validResponses = modelResponses.filter(r => r.content.length > 0);

    if (validResponses.length === 0) {
      throw new Error('All assigned models failed to generate a response');
    }

    // Step 4: Coordinate final response
    const finalResponse = await this.coordinateResponses(optimizedPrompt, validResponses, taskAssignments);

    return {
      finalResponse,
      individualResponses: validResponses,
      aggregationMethod: this.determineAggregationMethod(validResponses),
      taskAssignments,
      promptOptimization,
    };
  }

  async streamMultiModelResponse(
    messages: any[],
    options: {
      temperature?: number;
      maxTokens?: number;
      onChunk?: (chunk: string) => void;
      useOptimization?: boolean;
    } = {}
  ): Promise<AsyncIterable<string>> {
    const { temperature = 0.7, maxTokens = 4000, onChunk, useOptimization = true } = options;

    if (!this.useHierarchicalSystem) {
      return this.streamLegacyResponse(messages, options);
    }

    const userPrompt = messages[messages.length - 1]?.content || '';
    
    // Quick optimization for streaming (lighter version)
    let optimizedMessages = messages;
    if (useOptimization) {
      try {
        const optimization = await geminiManager.optimizePrompt(userPrompt);
        if (optimization.optimizedPrompt !== userPrompt) {
          optimizedMessages = [
            ...messages.slice(0, -1),
            { ...messages[messages.length - 1], content: optimization.optimizedPrompt }
          ];
        }
      } catch (error) {
        console.debug('Quick optimization failed, using original prompt:', error);
      }
    }

    // Get task assignments for streaming
    const taskAssignments = await geminiManager.assignTasks(userPrompt, this.models);
    const primaryAssignment = taskAssignments.find(a => a.role.includes('primary')) || taskAssignments[0];
    
    // Use assigned primary model for streaming, default to best preview model
    const modelId = primaryAssignment?.model as GroqModelId || MULTI_MODEL_CONFIG.primary;
    const model = groq(modelId);
    
    const result = await streamText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...optimizedMessages
      ],
      temperature,
      maxTokens,
    });

    // Run background tasks for coordination and learning
    this.runBackgroundTasks(userPrompt, optimizedMessages, { temperature, maxTokens });

    return result.textStream;
  }

  private async runBackgroundTasks(
    userPrompt: string,
    messages: any[],
    options: { temperature: number; maxTokens: number }
  ): Promise<void> {
    // Run Kimi K2 in background for code-related tasks
    if (/code|programming|debug|implement|function|class|api|bug|fix/i.test(userPrompt)) {
      try {
        await kimiK2.generateCodeResponse(userPrompt, {
          language: 'typescript',
          framework: 'react'
        });
      } catch (error) {
        console.debug('Background Kimi K2 task failed:', error);
      }
    }

    // Run other models in background for analysis
    const backgroundModels = this.models.filter(m => m !== MULTI_MODEL_CONFIG.primary);
    
    backgroundModels.forEach(async (modelId) => {
      try {
        const model = groq(modelId);
        await generateText({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        });
      } catch (error) {
        console.debug(`Background model ${modelId} failed:`, error);
      }
    });
  }

  private calculateConfidence(text: string, isReasoningModel: boolean = false): number {
    // Simple confidence calculation based on response characteristics
    let confidence = 0.5; // Base confidence

    // Length factor (longer responses often more comprehensive)
    const lengthFactor = Math.min(text.length / 1000, 1) * 0.2;
    confidence += lengthFactor;

    // Code block presence (indicates actionable response)
    const codeBlocks = (text.match(/```/g) || []).length / 2;
    confidence += Math.min(codeBlocks * 0.1, 0.3);

    // Structured response (headers, lists, etc.)
    const structuredElements = (text.match(/^#+\s|^\d+\.\s|^-\s/gm) || []).length;
    confidence += Math.min(structuredElements * 0.02, 0.2);

    // Reasoning model bonus
    if (isReasoningModel) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  private async coordinateResponses(
    userPrompt: string,
    responses: MultiModelResponse[],
    taskAssignments: TaskAssignment[]
  ): Promise<string> {
    // Check for Kimi K2 override first
    const kimiResponse = responses.find(r => r.model === 'kimi-k2' && r.hasOverride);
    if (kimiResponse && /code|programming|debug|implement|function|class|api|bug|fix/i.test(userPrompt)) {
      return kimiResponse.content;
    }

    // Use Gemini manager to coordinate responses
    const modelResponses = responses.map(r => ({
      model: r.model,
      response: r.content,
      role: r.role || 'general'
    }));

    try {
      return await geminiManager.coordinateResponse(userPrompt, modelResponses);
    } catch (error) {
      console.error('Response coordination failed:', error);
      return this.fallbackAggregation(responses);
    }
  }

  private fallbackAggregation(responses: MultiModelResponse[]): string {
    // Fallback to legacy aggregation
    const sortedResponses = [...responses].sort((a, b) => b.confidence - a.confidence);
    return sortedResponses[0]?.content || 'I apologize, but I encountered an error processing your request.';
  }

  private determineAggregationMethod(responses: MultiModelResponse[]): AggregatedResponse['aggregationMethod'] {
    if (responses.some(r => r.model === 'kimi-k2' && r.hasOverride)) {
      return 'kimi_override';
    }
    return 'manager_coordinated';
  }

  private async executeKimiK2Task(prompt: string, assignment: TaskAssignment): Promise<MultiModelResponse> {
    const response = await kimiK2.generateCodeResponse(prompt, {
      language: 'typescript',
      framework: 'react'
    });

    return {
      content: response.content,
      model: 'kimi-k2',
      confidence: response.confidence,
      reasoning: response.reasoning,
      role: assignment.role,
      hasOverride: response.hasOverride,
    };
  }

  private async executeGroqTask(
    prompt: string,
    messages: any[],
    assignment: TaskAssignment,
    temperature: number,
    maxTokens: number
  ): Promise<MultiModelResponse> {
    const model = groq(assignment.model as GroqModelId);
    const isReasoningModel = assignment.model === MULTI_MODEL_CONFIG.reasoning;
    const isAdvancedModel = assignment.model === MULTI_MODEL_CONFIG.primary;
    
    // Adjust parameters for different model types
    const adjustedTemperature = isReasoningModel ? 0.1 : isAdvancedModel ? 0.3 : temperature;
    const adjustedMaxTokens = assignment.model === 'qwen/qwen3-32b' ? Math.min(maxTokens, 40960) : maxTokens;
    
    const result = await generateText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(0, -1),
        { role: 'user', content: prompt }
      ],
      temperature: adjustedTemperature,
      maxTokens: adjustedMaxTokens,
    });

    return {
      content: result.text,
      model: assignment.model,
      confidence: this.calculateConfidence(result.text, isReasoningModel || isAdvancedModel),
      reasoning: isReasoningModel ? result.text : undefined,
      role: assignment.role,
      hasOverride: false,
    };
  }

  private async generateLegacyMultiModelResponse(
    messages: { role: string; content: string }[],
    options: GenerationOptions
  ): Promise<AggregatedResponse> {
    // Legacy implementation for fallback
    const { temperature = 0.7, maxTokens = 4000, includeReasoning = true } = options;

    const modelPromises = this.models.map(async (modelId) => {
      try {
        const model = groq(modelId);
        const isReasoningModel = modelId === MULTI_MODEL_CONFIG.reasoning;
        
        const result = await generateText({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: isReasoningModel ? 0.1 : temperature,
          maxTokens,
        });

        return {
          content: result.text,
          model: modelId,
          confidence: this.calculateConfidence(result.text, isReasoningModel),
          reasoning: isReasoningModel ? result.text : undefined,
        } as MultiModelResponse;
      } catch (error) {
        console.error(`Error with model ${modelId}:`, error);
        return {
          content: '',
          model: modelId,
          confidence: 0,
        } as MultiModelResponse;
      }
    });

    const responses = await Promise.all(modelPromises);
    const validResponses = responses.filter(r => r.content.length > 0);

    if (validResponses.length === 0) {
      throw new Error('All models failed to generate a response');
    }

    return {
      finalResponse: this.fallbackAggregation(validResponses),
      individualResponses: validResponses,
      aggregationMethod: 'best_confidence',
    };
  }

  private async streamLegacyResponse(
    messages: { role: string; content: string }[],
    options: GenerationOptions
  ): Promise<AsyncIterable<string>> {
    const { temperature = 0.7, maxTokens = 4000 } = options;
    const model = groq(MULTI_MODEL_CONFIG.primary); // Use best preview model for streaming
    
    const result = await streamText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.3, // Optimized for DeepSeek R1
      maxTokens,
    });

    return result.textStream;
  }

  // Get available models for this instance
  getAvailableModels(): GroqModelId[] {
    return this.models;
  }

  // Control hierarchical system
  setHierarchicalMode(enabled: boolean): void {
    this.useHierarchicalSystem = enabled;
  }

  getSystemInfo(): { hierarchical: boolean; models: string[]; hasKimiK2: boolean } {
    return {
      hierarchical: this.useHierarchicalSystem,
      models: this.models,
      hasKimiK2: true,
    };
  }
}

export const multiModelAI = new MultiModelAI();
export default multiModelAI;