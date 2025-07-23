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

// Debug flag controlling verbose logging (set VITE_DEBUG_MULTIMODEL="true" to enable)
const DEBUG =
  typeof import.meta !== 'undefined' &&
  (import.meta.env.DEV || import.meta.env.VITE_DEBUG_MULTIMODEL === 'true');

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

  private async callSecureGroqProxy(
    messages: any[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<AsyncIterable<string>> {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const response = await fetch(`${baseUrl}/api/groq/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        options
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle AI SDK's data stream format (following official patterns)
    async function* streamGenerator() {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('0:')) {
              // AI SDK data stream format: parse the JSON after the prefix
              const data = line.slice(2);
              try {
                const parsed = JSON.parse(data);
                if (typeof parsed === 'string') {
                  yield parsed;
                }
              } catch (parseError) {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }

    return streamGenerator();
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
    if (DEBUG) {
      console.log('🤖 MultiModelAI Debug: Starting streamMultiModelResponse');
      console.log('📝 Messages count:', messages.length);
      console.log('⚙️ Options:', options);
    }

    const {
      temperature = 0.7,
      maxTokens = 4000,
      onChunk,
      useOptimization = true,
      useTools = true,
    } = options;

    // If Groq is not configured fall back to a local stream implementation
    if (!isGroqConfigured) {
      if (DEBUG) console.log('🔧 Groq not configured, using fallback stream');
      const userPrompt = messages[messages.length - 1]?.content || '';
      return createFallbackStream(userPrompt);
    }

    // Use secure server-side proxy instead of exposing API key to client
    if (DEBUG) console.log('✅ Using secure server-side API proxy');

    // Allow opting-out of hierarchical coordination
    if (!this.useHierarchicalSystem) {
      if (DEBUG) console.log('🔄 Using legacy streaming system via secure proxy');
      return this.callSecureGroqProxy(messages, {
        model: MULTI_MODEL_CONFIG.primary,
        temperature,
        maxTokens
      });
    }

    const userPrompt = messages[messages.length - 1]?.content || '';
    if (DEBUG) console.log('💬 User prompt length:', userPrompt.length);

    // Lightweight, in-place prompt optimisation for streaming
    let optimisedMessages = messages;
    if (useOptimization) {
      if (DEBUG) console.log('🔧 Attempting quick prompt optimisation');
      try {
        const optimisation = await geminiManager.optimizePrompt(userPrompt);
        if (optimisation.optimizedPrompt !== userPrompt) {
          optimisedMessages = [
            ...messages.slice(0, -1),
            { ...messages[messages.length - 1], content: optimisation.optimizedPrompt },
          ];
          if (DEBUG) console.log('✅ Prompt optimised');
        } else if (DEBUG) {
          console.log('ℹ️ No optimisation necessary');
        }
      } catch (err) {
        if (DEBUG) console.warn('⚠️ Prompt optimisation failed, continuing with original:', err);
      }
    } else if (DEBUG) {
      console.log('⏭️ Prompt optimisation disabled');
    }

    try {
      if (DEBUG) console.log('🎯 Fetching task assignments');
      const taskAssignments = await geminiManager.assignTasks(userPrompt, this.models);
      if (DEBUG) console.log('📋 Task assignments:', taskAssignments);

      // Pick the primary (or first) assignment for streaming
      const primaryAssignment =
        taskAssignments.find((a) => a.role.includes('primary')) || taskAssignments[0];
      const modelId = (primaryAssignment?.model as GroqModelId) || MULTI_MODEL_CONFIG.primary;
      if (DEBUG) console.log('🤖 Streaming model selected:', modelId);

      const systemMessage = {
        role: 'system' as const,
        content:
          systemPrompt +
          (useTools
            ? '\n\nYou have access to tools for building and executing code. Use them when appropriate.'
            : ''),
      };

      if (DEBUG)
        console.log('📤 Invoking secure proxy stream', {
          temperature,
          maxTokens,
          model: modelId,
          toolsEnabled: useTools,
        });

      // Use secure proxy instead of direct AI SDK
      const result = await this.callSecureGroqProxy([systemMessage, ...optimisedMessages], {
        model: modelId,
        temperature,
        maxTokens
      });

      // Kick off background learning/coordination but don't await it
      this.runBackgroundTasks(userPrompt, optimisedMessages, {
        temperature,
        maxTokens,
        useTools,
      }).catch((err) => DEBUG && console.debug('Background task failed', err));

      // Optionally expose chunks during streaming
      if (onChunk) {
        (async () => {
          for await (const chunk of result) {
            try {
              onChunk(chunk);
            } catch (err) {
              if (DEBUG) console.warn('onChunk handler threw', err);
            }
          }
        })();
      }

      return result;
    } catch (taskErr) {
      console.error('❌ Streaming via primary model failed, attempting fallback:', taskErr);
      try {
        const result = await this.callSecureGroqProxy([
          { role: 'system' as const, content: systemPrompt },
          ...messages,
        ], {
          model: MULTI_MODEL_CONFIG.primary,
          temperature: 0.3,
          maxTokens,
        });
        return result;
      } catch (fallbackErr) {
        console.error('❌ Fallback streaming also failed:', fallbackErr);
        throw fallbackErr;
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
    messages: any[],
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
    messages: any[],
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