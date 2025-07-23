import { groq } from '@ai-sdk/groq';
import { streamText, generateText } from 'ai';
import { getAllModels, type GroqModelId, isGroqConfigured } from './groq';
import systemPrompt from './systemPrompt';
import { geminiManager, type TaskAssignment } from './geminiManager';
import { kimiK2, type KimiK2Response } from './kimiK2';
import { availableTools, toolCallExecutor, type ToolCall, type ToolCallResult } from './tool-calls';

interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  includeReasoning?: boolean;
  useTools?: boolean;
}

export interface MultiModelResponse {
  content: string;
  model: string;
  confidence: number;
  reasoning?: string;
  role?: string;
  hasOverride?: boolean;
  toolCalls?: ToolCall[];
  toolResults?: ToolCallResult[];
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
  toolCalls?: ToolCall[];
  toolResults?: ToolCallResult[];
}

// Primary models to use for multi-model responses - Using best preview models
const MULTI_MODEL_CONFIG = {
  primary: 'deepseek-r1-distill-llama-70b' as GroqModelId, // Most capable 70B model with 131k context
  secondary: 'qwen/qwen3-32b' as GroqModelId, // High-quality 32B model with 131k context
  reasoning: 'mistral-saba-24b' as GroqModelId, // Mistral's advanced reasoning model
  specialist: 'moonshotai/kimi-k2-instruct' as GroqModelId, // Kimi K2 for code specialization
};

// Simple fallback for development
async function* createFallbackStream(userPrompt: string): AsyncIterable<string> {
  console.log("🔧 MultiModelAI Debug: Using fallback development response");
  
  const responses = [
    "I understand you're trying to test the chat functionality. ",
    "Currently, the AI service is not configured for local development. ",
    "However, this system is working properly on the deployed version with proper API keys. ",
    "To test locally, you would need to set up the VITE_GROQ_API_KEY environment variable. ",
    "The chat interface is working correctly - you can see this message being streamed! ",
    "Feel free to deploy to Vercel where the environment variables are configured to test the full AI functionality."
  ];
  
  for (const response of responses) {
    // Simulate streaming with delay
    await new Promise(resolve => setTimeout(resolve, 200));
    yield response;
  }
}

class MultiModelAI {
  private models: GroqModelId[];
  private useHierarchicalSystem: boolean = true;
  private useTools: boolean = true;

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
      useTools?: boolean;
    } = {}
  ): Promise<AggregatedResponse> {
    const { temperature = 0.7, maxTokens = 4000, includeReasoning = true, useOptimization = true, useTools = true } = options;
    
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
            return await this.executeGroqTask(optimizedPrompt, messages, assignment, temperature, maxTokens, useTools);
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

    // Step 4: Execute tool calls if any
    let toolResults: ToolCallResult[] = [];
    const allToolCalls = validResponses.flatMap(r => r.toolCalls || []);
    
    if (useTools && allToolCalls.length > 0) {
      toolResults = await Promise.all(
        allToolCalls.map(toolCall => toolCallExecutor.executeToolCall(toolCall))
      );
    }

    // Step 5: Coordinate final response
    const finalResponse = await this.coordinateResponses(optimizedPrompt, validResponses, taskAssignments, toolResults);

    return {
      finalResponse,
      individualResponses: validResponses,
      aggregationMethod: this.determineAggregationMethod(validResponses),
      taskAssignments,
      promptOptimization,
      toolCalls: allToolCalls,
      toolResults,
    };
  }

  async streamMultiModelResponse(
    messages: any[],
    options: {
      temperature?: number;
      maxTokens?: number;
      onChunk?: (chunk: string) => void;
      useOptimization?: boolean;
      useTools?: boolean;
    } = {}
  ): Promise<AsyncIterable<string>> {
    console.log("🤖 MultiModelAI Debug: Starting streamMultiModelResponse");
    console.log("📝 Messages count:", messages.length);
    console.log("⚙️ Options:", options);
    
    const { temperature = 0.7, maxTokens = 4000, onChunk, useOptimization = true, useTools = true } = options;

    // Check if Groq is configured
    if (!isGroqConfigured) {
      console.log("🔧 MultiModelAI Debug: Groq not configured, using fallback");
      const userPrompt = messages[messages.length - 1]?.content || '';
      return createFallbackStream(userPrompt);
    }

    // Check API key first
    const apiKey = typeof window !== 'undefined' ? 
      (window as any).__VITE_GROQ_API_KEY__ || import.meta.env.VITE_GROQ_API_KEY :
      import.meta.env.VITE_GROQ_API_KEY;
      
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      console.error("❌ MultiModelAI Debug: No valid API key found");
      throw new Error("API_KEY_MISSING");
    }
    console.log("✅ MultiModelAI Debug: API key available");

    if (!this.useHierarchicalSystem) {
      console.log("🔄 MultiModelAI Debug: Using legacy response system");
      return this.streamLegacyResponse(messages, options);
    }

    const userPrompt = messages[messages.length - 1]?.content || '';
    console.log("💬 MultiModelAI Debug: User prompt length:", userPrompt.length);
    
    // Quick optimization for streaming (lighter version)
    let optimizedMessages = messages;
    if (useOptimization) {
      try {
        console.log("🔧 MultiModelAI Debug: Attempting prompt optimization");
        const optimization = await geminiManager.optimizePrompt(userPrompt);
        if (optimization.optimizedPrompt !== userPrompt) {
          optimizedMessages = [
            ...messages.slice(0, -1),
            { ...messages[messages.length - 1], content: optimization.optimizedPrompt }
          ];
          console.log("✅ MultiModelAI Debug: Prompt optimized");
        } else {
          console.log("ℹ️ MultiModelAI Debug: No optimization needed");
        }
      } catch (error) {
        console.warn('⚠️ MultiModelAI Debug: Quick optimization failed, using original prompt:', error);
      }
    } else {
      console.log("⏭️ MultiModelAI Debug: Skipping optimization");
    }

    try {
      console.log("🎯 MultiModelAI Debug: Getting task assignments");
      // Get task assignments for streaming
      const taskAssignments = await geminiManager.assignTasks(userPrompt, this.models);
      console.log("📋 MultiModelAI Debug: Task assignments:", taskAssignments);
      
      const primaryAssignment = taskAssignments.find(a => a.role.includes('primary')) || taskAssignments[0];
      console.log("🎯 MultiModelAI Debug: Primary assignment:", primaryAssignment);
      
      // Use assigned primary model for streaming, default to best preview model
      const modelId = primaryAssignment?.model as GroqModelId || MULTI_MODEL_CONFIG.primary;
      console.log("🤖 MultiModelAI Debug: Selected model:", modelId);
      
      const model = groq(modelId);
      
      // Prepare messages with tool support
      const systemMessage = {
        role: 'system' as const,
        content: systemPrompt + (useTools ? '\n\nYou have access to tools for building and executing code. Use them when appropriate.' : '')
      };

      console.log("📤 MultiModelAI Debug: Calling streamText with model:", modelId);
      console.log("📊 MultiModelAI Debug: Temperature:", temperature, "MaxTokens:", maxTokens);
      
      const result = await streamText({
        model,
        messages: [
          systemMessage,
          ...optimizedMessages
        ],
        temperature,
        maxTokens,
        tools: useTools ? this.prepareToolsForAI() : undefined,
      });

      console.log("✅ MultiModelAI Debug: streamText call successful");

      // Run background tasks for coordination and learning
      console.log("🔄 MultiModelAI Debug: Starting background tasks");
      this.runBackgroundTasks(userPrompt, optimizedMessages, { temperature, maxTokens, useTools });

      console.log("🌊 MultiModelAI Debug: Returning text stream");
      return result.textStream;
      
    } catch (taskError) {
      console.error("❌ MultiModelAI Debug: Task assignment failed, falling back to simple streaming:", taskError);
      
      // Fallback to simple streaming
      try {
        const fallbackModel = groq(MULTI_MODEL_CONFIG.primary);
        console.log("🔄 MultiModelAI Debug: Using fallback model:", MULTI_MODEL_CONFIG.primary);
        
        const systemMessage = {
          role: 'system' as const,
          content: systemPrompt
        };

        const result = await streamText({
          model: fallbackModel,
          messages: [
            systemMessage,
            ...optimizedMessages
          ],
          temperature: 0.3, // Use conservative temperature for fallback
          maxTokens,
        });

        console.log("✅ MultiModelAI Debug: Fallback streaming successful");
        return result.textStream;
        
      } catch (fallbackError) {
        console.error("❌ MultiModelAI Debug: Fallback streaming also failed:", fallbackError);
        throw fallbackError;
      }
    }
  }

  private prepareToolsForAI() {
    // Convert our tool definitions to the format expected by the AI SDK
    const tools: Record<string, any> = {};
    
    availableTools.forEach(tool => {
      tools[tool.function.name] = {
        description: tool.function.description,
        parameters: tool.function.parameters
      };
    });

    return tools;
  }

  private async runBackgroundTasks(
    userPrompt: string,
    messages: any[],
    options: { temperature: number; maxTokens: number; useTools?: boolean }
  ): Promise<void> {
    // Run Kimi K2 in background for code-related tasks
    if (/code|programming|debug|implement|function|class|api|bug|fix|build|create|website/i.test(userPrompt)) {
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
            { role: 'system' as const, content: systemPrompt },
            ...messages
          ],
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          tools: options.useTools ? this.prepareToolsForAI() : undefined,
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

    // Tool usage bonus
    const toolMentions = (text.match(/create_nextjs_project|execute_code|create_file/g) || []).length;
    confidence += Math.min(toolMentions * 0.05, 0.15);

    // Reasoning model bonus
    if (isReasoningModel) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  private async coordinateResponses(
    userPrompt: string,
    responses: MultiModelResponse[],
    taskAssignments: TaskAssignment[],
    toolResults?: ToolCallResult[]
  ): Promise<string> {
    // Check for Kimi K2 override first
    const kimiResponse = responses.find(r => r.model === 'kimi-k2' && r.hasOverride);
    if (kimiResponse && /code|programming|debug|implement|function|class|api|bug|fix|build|create|website/i.test(userPrompt)) {
      return this.appendToolResults(kimiResponse.content, toolResults);
    }

    // Use Gemini manager to coordinate responses
    const modelResponses = responses.map(r => ({
      model: r.model,
      response: r.content,
      role: r.role || 'general'
    }));

    try {
      const coordinatedResponse = await geminiManager.coordinateResponse(userPrompt, modelResponses);
      return this.appendToolResults(coordinatedResponse, toolResults);
    } catch (error) {
      console.error('Response coordination failed:', error);
      return this.appendToolResults(this.fallbackAggregation(responses), toolResults);
    }
  }

  private appendToolResults(content: string, toolResults?: ToolCallResult[]): string {
    if (!toolResults || toolResults.length === 0) {
      return content;
    }

    let appendedContent = content;
    
    toolResults.forEach(result => {
      if (result.success && result.output) {
        appendedContent += `\n\n---\n**Tool Execution Result:**\n${result.output}`;
      }
    });

    return appendedContent;
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
    if (responses.some(r => r.toolCalls && r.toolCalls.length > 0)) {
      return 'manager_coordinated';
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
    maxTokens: number,
    useTools: boolean = true
  ): Promise<MultiModelResponse> {
    const model = groq(assignment.model as GroqModelId);
    const isReasoningModel = assignment.model === MULTI_MODEL_CONFIG.reasoning;
    const isAdvancedModel = assignment.model === MULTI_MODEL_CONFIG.primary;
    
    // Adjust parameters for different model types
    const adjustedTemperature = isReasoningModel ? 0.1 : isAdvancedModel ? 0.3 : temperature;
    const adjustedMaxTokens = assignment.model === 'qwen/qwen3-32b' ? Math.min(maxTokens, 40960) : maxTokens;
    
    const systemMessage = {
      role: 'system' as const,
      content: systemPrompt + (useTools ? '\n\nYou have access to tools for building and executing code. Use them when appropriate.' : '')
    };

    const result = await generateText({
      model,
      messages: [
        systemMessage,
        ...messages.slice(0, -1),
        { role: 'user', content: prompt }
      ],
      temperature: adjustedTemperature,
      maxTokens: adjustedMaxTokens,
      tools: useTools ? this.prepareToolsForAI() : undefined,
    });

    // Extract tool calls if any
    const toolCalls: ToolCall[] = [];
    if (result.toolCalls) {
      result.toolCalls.forEach(toolCall => {
        toolCalls.push({
          id: toolCall.toolCallId,
          type: 'function',
          function: {
            name: toolCall.toolName,
            arguments: JSON.stringify(toolCall.args)
          }
        });
      });
    }

    return {
      content: result.text,
      model: assignment.model,
      confidence: this.calculateConfidence(result.text, isReasoningModel || isAdvancedModel),
      reasoning: isReasoningModel ? result.text : undefined,
      role: assignment.role,
      hasOverride: false,
      toolCalls,
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
            { role: 'system' as const, content: systemPrompt },
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
        { role: 'system' as const, content: systemPrompt },
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

  // Control tool usage
  setToolUsage(enabled: boolean): void {
    this.useTools = enabled;
  }

  getSystemInfo(): { hierarchical: boolean; models: string[]; hasKimiK2: boolean; toolsEnabled: boolean } {
    return {
      hierarchical: this.useHierarchicalSystem,
      models: this.models,
      hasKimiK2: true,
      toolsEnabled: this.useTools,
    };
  }
}

export const multiModelAI = new MultiModelAI();
export default multiModelAI;