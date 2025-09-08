/**
 * Sequential Thinking Engine (Kimi K2 default)
 *
 * Replaces Groq-specific implementation with a provider-agnostic approach
 * defaulting to moonshotai/kimi-k2-instruct-0905 from app.config.
 */

import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getSequentialThinkingService } from '@/lib/mcp/sequential-thinking-service';
import { getReasoningSearchService } from '@/lib/search/reasoning-search';
import { appConfig } from '@/config/app.config';

export interface ThoughtStep {
  stepNumber: number;
  thought: string;
  confidence: number;
  searchQueries?: string[];
  searchResults?: any[];
  alternatives?: string[];
  reasoning: string;
  timestamp: number;
}

export interface ReasoningPath {
  pathId: string;
  steps: ThoughtStep[];
  totalEstimatedSteps: number;
  currentStep: number;
  confidence: number;
  isComplete: boolean;
  branchedFrom?: string;
}

export interface UltraThinkRequest {
  query: string;
  context?: any;
  model?: string;
  enableSearch?: boolean;
  maxThoughts?: number;
  confidenceThreshold?: number;
  enableBranching?: boolean;
  userSkillLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface UltraThinkResponse {
  reasoningPaths: ReasoningPath[];
  finalAnswer: string;
  confidence: number;
  searchSources: any[];
  processingTime: number;
  thoughtCount: number;
  ultraThinkMode: boolean;
}

export interface ReasoningProgress {
  type: 'thought_start' | 'thought_complete' | 'search_query' | 'search_results' | 'branch_created' | 'reasoning_complete';
  step?: ThoughtStep;
  pathId?: string;
  searchQuery?: string;
  searchResults?: any[];
  progress?: number;
  message?: string;
}

function getProvider(modelId: string) {
  const isAnthropic = modelId.startsWith('anthropic/');
  const isGoogle = modelId.startsWith('google/');
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY, baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1' });
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  const actual = isAnthropic ? modelId.replace('anthropic/', '') : (isGoogle ? modelId.replace('google/', '') : modelId);
  const provider = isAnthropic ? anthropic : (isGoogle ? google : openai);
  return { provider, actualModel: actual };
}

export class GroqSequentialThinking {
  private mcpService;
  private searchService;

  constructor() {
    this.mcpService = getSequentialThinkingService();
    this.searchService = getReasoningSearchService();
  }

  async processUltraThink(
    request: UltraThinkRequest,
    progressCallback?: (progress: ReasoningProgress) => void
  ): Promise<UltraThinkResponse> {
    const startTime = Date.now();
    const reasoningPaths: ReasoningPath[] = [];
    const searchSources: any[] = [];

    try {
      await this.mcpService.initialize();

      const primaryPath = await this.createReasoningPath(request, progressCallback);
      reasoningPaths.push(primaryPath);

      if (request.enableBranching && this.shouldCreateBranches(request.query)) {
        const branchPaths = await this.createAlternativePaths(request, primaryPath, progressCallback);
        reasoningPaths.push(...branchPaths);
      }

      const bestPath = this.selectBestReasoningPath(reasoningPaths);
      const finalAnswer = await this.generateFinalAnswer(request, bestPath, progressCallback);

      reasoningPaths.forEach(path => {
        path.steps.forEach(step => {
          if (step.searchResults) searchSources.push(...step.searchResults);
        });
      });

      return {
        reasoningPaths,
        finalAnswer,
        confidence: bestPath.confidence,
        searchSources: this.deduplicateSearchSources(searchSources),
        processingTime: Date.now() - startTime,
        thoughtCount: reasoningPaths.reduce((t, p) => t + p.steps.length, 0),
        ultraThinkMode: true
      };
    } catch (error) {
      console.error('UltraThink processing error:', error);
      throw new Error(`Sequential thinking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createReasoningPath(
    request: UltraThinkRequest,
    progressCallback?: (progress: ReasoningProgress) => void,
    branchedFrom?: string
  ): Promise<ReasoningPath> {
    const pathId = `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const steps: ThoughtStep[] = [];
    let currentStep = 1;
    let totalEstimatedSteps = request.maxThoughts || 5;
    let nextThoughtNeeded = true;

    const path: ReasoningPath = {
      pathId,
      steps,
      totalEstimatedSteps,
      currentStep,
      confidence: 0,
      isComplete: false,
      branchedFrom
    };

    progressCallback?.({ type: 'thought_start', pathId, progress: 0, message: `Starting reasoning path${branchedFrom ? ' (alternative approach)' : ''}` });

    while (nextThoughtNeeded && currentStep <= totalEstimatedSteps) {
      const thoughtResponse = await this.generateThought(
        request,
        steps,
        currentStep,
        totalEstimatedSteps
      );

      const thought: ThoughtStep = {
        stepNumber: currentStep,
        thought: thoughtResponse.thought,
        confidence: thoughtResponse.confidence,
        reasoning: thoughtResponse.reasoning,
        timestamp: Date.now(),
        searchQueries: [],
        searchResults: [],
        alternatives: []
      };

      progressCallback?.({ type: 'thought_complete', step: thought, pathId, progress: (currentStep / totalEstimatedSteps) * 100, message: `Completed thought ${currentStep}/${totalEstimatedSteps}` });

      if (request.enableSearch && this.shouldSearch(thought.thought)) {
        await this.enhanceThoughtWithSearch(thought, request.query, progressCallback);
      }

      const mcpResponse = await this.mcpService.processThought({
        thought: thought.thought,
        thoughtNumber: currentStep,
        totalThoughts: totalEstimatedSteps,
        context: {
          query: request.query,
          previousThoughts: steps.map(s => s.thought),
          searchEnabled: request.enableSearch
        }
      });

      if (mcpResponse.alternatives) {
        thought.alternatives = mcpResponse.alternatives;
      }

      steps.push(thought);

      nextThoughtNeeded = mcpResponse.nextThoughtNeeded;
      totalEstimatedSteps = mcpResponse.adjustedTotalThoughts || totalEstimatedSteps;
      currentStep++;

      path.confidence = steps.reduce((avg, step) => avg + step.confidence, 0) / steps.length;
    }

    path.currentStep = currentStep - 1;
    path.totalEstimatedSteps = totalEstimatedSteps;
    path.isComplete = !nextThoughtNeeded || currentStep > totalEstimatedSteps;

    return path;
  }

  private async generateThought(
    request: UltraThinkRequest,
    previousSteps: ThoughtStep[],
    stepNumber: number,
    totalSteps: number
  ): Promise<{thought: string, confidence: number, reasoning: string}> {
    const modelId = request.model || appConfig.ai.defaultModel;
    const { provider, actualModel } = getProvider(modelId);

    const previousThoughts = previousSteps.map(step => `Step ${step.stepNumber}: ${step.thought}`).join('\n');

    const systemPrompt = `You are an advanced reasoning system performing sequential thinking. This is step ${stepNumber} of approximately ${totalSteps} steps.

Your task is to think deeply about the user's query and provide ONE specific thought or analysis step that builds on previous thinking.

CRITICAL INSTRUCTIONS:
1. Provide exactly ONE thought for this step - don't try to solve everything at once
2. Build logically on previous thoughts if any exist
3. Use <think> tags to show your reasoning process
4. End with a confidence score (0-100) for this specific thought
5. Be thorough but focused on just this one aspect

Previous thoughts:
${previousThoughts}

Current query: "${request.query}"

Format your response as:
<think>
Your internal reasoning about what to think about in this step, considering the context and previous thoughts...
</think>

THOUGHT: [Your specific thought or analysis for this step]
CONFIDENCE: [0-100 score for this thought]`;

    const result = await streamText({
      model: provider(actualModel),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please provide step ${stepNumber} of your reasoning about: "${request.query}"` }
      ],
      temperature: 0.7,
      maxTokens: 1000
    });

    let fullResponse = '';
    for await (const textPart of result.textStream) {
      fullResponse += textPart;
    }

    const thinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>/);
    const thoughtMatch = fullResponse.match(/THOUGHT:\s*([\s\S]*?)(?=CONFIDENCE:|$)/);
    const confidenceMatch = fullResponse.match(/CONFIDENCE:\s*(\d+)/);

    return {
      thought: thoughtMatch?.[1]?.trim() || fullResponse.split('THOUGHT:')[1]?.split('CONFIDENCE:')[0]?.trim() || fullResponse.trim(),
      reasoning: thinkMatch?.[1]?.trim() || 'No explicit reasoning provided',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 75
    };
  }

  private async enhanceThoughtWithSearch(
    thought: ThoughtStep,
    originalQuery: string,
    progressCallback?: (progress: ReasoningProgress) => void
  ): Promise<void> {
    const searchQueries = this.generateSearchQueries(thought.thought, originalQuery);
    thought.searchQueries = searchQueries;

    for (const query of searchQueries) {
      progressCallback?.({ type: 'search_query', searchQuery: query, message: `Searching for: ${query}` });
      try {
        const searchResults = await this.searchService.searchForReasoning(query, { maxResults: 3, relevanceThreshold: 0.7 });
        if (searchResults && searchResults.length > 0) {
          thought.searchResults?.push(...searchResults);
          progressCallback?.({ type: 'search_results', searchResults, message: `Found ${searchResults.length} relevant sources` });
        }
      } catch (error) {
        console.warn(`Search failed for query "${query}":`, error);
      }
    }
  }

  private generateSearchQueries(thought: string, originalQuery: string): string[] {
    const queries: string[] = [];
    const words = thought.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    const importantWords = words.filter(word => !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word));

    if (importantWords.length >= 2) {
      queries.push(`${originalQuery} ${importantWords.slice(0, 3).join(' ')}`);
    }

    const technicalTerms = words.filter(word => word.length > 5 && (word.includes('tion') || word.includes('ment') || word.includes('ness') || word.includes('able') || word.match(/^[A-Z][a-z]+[A-Z]/)));
    if (technicalTerms.length > 0) {
      queries.push(`${technicalTerms[0]} ${originalQuery.split(' ').slice(0, 2).join(' ')}`);
    }

    return queries.slice(0, 2);
  }

  private shouldSearch(thought: string): boolean {
    const searchIndicators = ['how', 'what', 'why', 'when', 'where','example', 'best practice', 'documentation','research', 'study', 'evidence', 'data','recent', 'current', 'latest', 'new'];
    const lowerThought = thought.toLowerCase();
    return searchIndicators.some(indicator => lowerThought.includes(indicator));
  }

  private shouldCreateBranches(query: string): boolean {
    const branchIndicators = ['complex', 'multiple', 'various', 'different','alternatives', 'options', 'approaches', 'strategies','compare', 'versus', 'vs', 'or'];
    const lowerQuery = query.toLowerCase();
    return branchIndicators.some(indicator => lowerQuery.includes(indicator)) || query.split(' ').length > 10;
  }

  private async createAlternativePaths(
    request: UltraThinkRequest,
    primaryPath: ReasoningPath,
    progressCallback?: (progress: ReasoningProgress) => void
  ): Promise<ReasoningPath[]> {
    const alternatives: ReasoningPath[] = [];
    progressCallback?.({ type: 'branch_created', message: 'Creating alternative reasoning approach...' });

    const alternativeRequest = { ...request, maxThoughts: Math.min(request.maxThoughts || 5, 4) };

    try {
      const altPath = await this.createReasoningPath(alternativeRequest, progressCallback, primaryPath.pathId);
      alternatives.push(altPath);
    } catch (error) {
      console.warn('Failed to create alternative reasoning path:', error);
    }

    return alternatives;
  }

  private selectBestReasoningPath(paths: ReasoningPath[]): ReasoningPath {
    return paths.reduce((best, current) => {
      const currentScore = current.confidence * (current.isComplete ? 1.2 : 1.0);
      const bestScore = best.confidence * (best.isComplete ? 1.2 : 1.0);
      return currentScore > bestScore ? current : best;
    });
  }

  private async generateFinalAnswer(
    request: UltraThinkRequest,
    bestPath: ReasoningPath,
    progressCallback?: (progress: ReasoningProgress) => void
  ): Promise<string> {
    progressCallback?.({ type: 'thought_start', message: 'Generating final answer...' });

    const modelId = request.model || appConfig.ai.defaultModel;
    const { provider, actualModel } = getProvider(modelId);

    const reasoningContext = bestPath.steps.map(step => {
      let stepContent = `Step ${step.stepNumber}: ${step.thought}`;
      if (step.searchResults && step.searchResults.length > 0) {
        stepContent += `\nSources: ${step.searchResults.map(r => `${r.title} - ${r.description}`).join('; ')}`;
      }
      return stepContent;
    }).join('\n\n');

    const systemPrompt = `You are providing a final, comprehensive answer based on sequential reasoning analysis.

REASONING PROCESS:
${reasoningContext}

INSTRUCTIONS:
1. Synthesize the reasoning steps into a clear, comprehensive answer
2. Reference specific insights from the reasoning process
3. Include relevant information from search sources when available
4. Provide a practical, actionable response
5. Maintain the depth and quality of analysis from the reasoning process

Query: "${request.query}"

Provide your final answer based on the reasoning analysis above.`;

    const result = await streamText({
      model: provider(actualModel),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please provide your final answer based on the reasoning analysis.' }
      ],
      temperature: 0.6,
      maxTokens: 2000
    });

    let finalAnswer = '';
    for await (const textPart of result.textStream) {
      finalAnswer += textPart;
    }

    return finalAnswer;
  }

  private deduplicateSearchSources(sources: any[]): any[] {
    const seen = new Set();
    return sources.filter(source => {
      const key = source.url || source.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

let groqSequentialThinkingInstance: GroqSequentialThinking | null = null;

export function getGroqSequentialThinking(): GroqSequentialThinking {
  if (!groqSequentialThinkingInstance) {
    groqSequentialThinkingInstance = new GroqSequentialThinking();
  }
  return groqSequentialThinkingInstance;
}

export async function processUltraThink(
  request: UltraThinkRequest,
  progressCallback?: (progress: ReasoningProgress) => void
): Promise<UltraThinkResponse> {
  const engine = getGroqSequentialThinking();
  return engine.processUltraThink(request, progressCallback);
}
