/**
 * Groq Sequential Thinking Engine
 * 
 * Implements advanced sequential thinking capabilities specifically for Groq models,
 * leveraging Groq's reasoning API and MCP integration for enhanced reasoning experiences.
 */

import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { getSequentialThinkingService } from '@/lib/mcp/sequential-thinking-service';
import { getReasoningSearchService } from '@/lib/search/reasoning-search';

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

export class GroqSequentialThinking {
  private groqClient;
  private mcpService;
  private searchService;

  constructor() {
    this.groqClient = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    });
    this.mcpService = getSequentialThinkingService();
    this.searchService = getReasoningSearchService();
  }

  /**
   * Process a query using sequential thinking with UltraThink mode
   */
  async processUltraThink(
    request: UltraThinkRequest,
    progressCallback?: (progress: ReasoningProgress) => void
  ): Promise<UltraThinkResponse> {
    const startTime = Date.now();
    const reasoningPaths: ReasoningPath[] = [];
    const searchSources: any[] = [];
    
    try {
      // Initialize MCP Sequential Thinking
      await this.mcpService.initialize();
      
      // Start primary reasoning path
      const primaryPath = await this.createReasoningPath(request, progressCallback);
      reasoningPaths.push(primaryPath);
      
      // Enable branching for complex problems
      if (request.enableBranching && this.shouldCreateBranches(request.query)) {
        const branchPaths = await this.createAlternativePaths(request, primaryPath, progressCallback);
        reasoningPaths.push(...branchPaths);
      }
      
      // Select best path and generate final answer
      const bestPath = this.selectBestReasoningPath(reasoningPaths);
      const finalAnswer = await this.generateFinalAnswer(request, bestPath, progressCallback);
      
      // Collect all search sources used
      reasoningPaths.forEach(path => {
        path.steps.forEach(step => {
          if (step.searchResults) {
            searchSources.push(...step.searchResults);
          }
        });
      });
      
      const processingTime = Date.now() - startTime;
      const thoughtCount = reasoningPaths.reduce((total, path) => total + path.steps.length, 0);
      
      progressCallback?.({
        type: 'reasoning_complete',
        progress: 100,
        message: `Completed reasoning with ${thoughtCount} thoughts across ${reasoningPaths.length} path(s)`
      });
      
      return {
        reasoningPaths,
        finalAnswer,
        confidence: bestPath.confidence,
        searchSources: this.deduplicateSearchSources(searchSources),
        processingTime,
        thoughtCount,
        ultraThinkMode: true
      };
      
    } catch (error) {
      console.error('UltraThink processing error:', error);
      throw new Error(`Sequential thinking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a reasoning path using MCP Sequential Thinking
   */
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
    
    progressCallback?.({
      type: 'thought_start',
      pathId,
      progress: 0,
      message: `Starting reasoning path${branchedFrom ? ' (alternative approach)' : ''}`
    });
    
    while (nextThoughtNeeded && currentStep <= totalEstimatedSteps) {
      // Generate thought using Groq with reasoning format
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
      
      progressCallback?.({
        type: 'thought_complete',
        step: thought,
        pathId,
        progress: (currentStep / totalEstimatedSteps) * 100,
        message: `Completed thought ${currentStep}/${totalEstimatedSteps}`
      });
      
      // Enhance thought with search if enabled
      if (request.enableSearch && this.shouldSearch(thought.thought)) {
        await this.enhanceThoughtWithSearch(thought, request.query, progressCallback);
      }
      
      // Check if we need more thoughts using MCP
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
      
      // Update thought with MCP insights
      if (mcpResponse.alternatives) {
        thought.alternatives = mcpResponse.alternatives;
      }
      
      steps.push(thought);
      
      // Update path progress
      nextThoughtNeeded = mcpResponse.nextThoughtNeeded;
      totalEstimatedSteps = mcpResponse.adjustedTotalThoughts || totalEstimatedSteps;
      currentStep++;
      
      // Update path confidence (running average)
      path.confidence = steps.reduce((avg, step) => avg + step.confidence, 0) / steps.length;
    }
    
    path.currentStep = currentStep - 1;
    path.totalEstimatedSteps = totalEstimatedSteps;
    path.isComplete = !nextThoughtNeeded || currentStep > totalEstimatedSteps;
    
    return path;
  }
  
  /**
   * Generate individual thought using Groq's reasoning capabilities
   */
  private async generateThought(
    request: UltraThinkRequest,
    previousSteps: ThoughtStep[],
    stepNumber: number,
    totalSteps: number
  ): Promise<{thought: string, confidence: number, reasoning: string}> {
    const model = request.model || 'llama-3.3-70b-versatile';
    
    // Build context from previous thoughts
    const previousThoughts = previousSteps.map(step => 
      `Step ${step.stepNumber}: ${step.thought}`
    ).join('\n');
    
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
      model: this.groqClient(model),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please provide step ${stepNumber} of your reasoning about: "${request.query}"` }
      ],
      temperature: 0.7,
      maxTokens: 1000,
      // Use Groq's reasoning format to get <think> tags
      experimental_providerMetadata: {
        groq: {
          reasoning_format: 'raw'
        }
      }
    });
    
    // Extract the full response
    let fullResponse = '';
    for await (const textPart of result.textStream) {
      fullResponse += textPart;
    }
    
    // Parse the response to extract thought, reasoning, and confidence
    const thinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>/);
    const thoughtMatch = fullResponse.match(/THOUGHT:\s*([\s\S]*?)(?=CONFIDENCE:|$)/);
    const confidenceMatch = fullResponse.match(/CONFIDENCE:\s*(\d+)/);
    
    return {
      thought: thoughtMatch?.[1]?.trim() || fullResponse.split('THOUGHT:')[1]?.split('CONFIDENCE:')[0]?.trim() || fullResponse.trim(),
      reasoning: thinkMatch?.[1]?.trim() || 'No explicit reasoning provided',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 75
    };
  }
  
  /**
   * Enhance thought with search results
   */
  private async enhanceThoughtWithSearch(
    thought: ThoughtStep,
    originalQuery: string,
    progressCallback?: (progress: ReasoningProgress) => void
  ): Promise<void> {
    // Generate search queries based on the thought
    const searchQueries = this.generateSearchQueries(thought.thought, originalQuery);
    thought.searchQueries = searchQueries;
    
    for (const query of searchQueries) {
      progressCallback?.({
        type: 'search_query',
        searchQuery: query,
        message: `Searching for: ${query}`
      });
      
      try {
        const searchResults = await this.searchService.searchForReasoning(query, {
          maxResults: 3,
          relevanceThreshold: 0.7
        });
        
        if (searchResults && searchResults.length > 0) {
          thought.searchResults?.push(...searchResults);
          progressCallback?.({
            type: 'search_results',
            searchResults: searchResults,
            message: `Found ${searchResults.length} relevant sources`
          });
        }
      } catch (error) {
        console.warn(`Search failed for query "${query}":`, error);
      }
    }
  }
  
  /**
   * Generate search queries based on thought content
   */
  private generateSearchQueries(thought: string, originalQuery: string): string[] {
    const queries: string[] = [];
    
    // Extract key terms and concepts from the thought
    const words = thought.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    const importantWords = words.filter(word => 
      !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word)
    );
    
    // Create focused search queries
    if (importantWords.length >= 2) {
      queries.push(`${originalQuery} ${importantWords.slice(0, 3).join(' ')}`);
    }
    
    // Look for specific concepts or technical terms
    const technicalTerms = words.filter(word => 
      word.length > 5 && (
        word.includes('tion') || 
        word.includes('ment') || 
        word.includes('ness') ||
        word.includes('able') ||
        word.match(/^[A-Z][a-z]+[A-Z]/)
      )
    );
    
    if (technicalTerms.length > 0) {
      queries.push(`${technicalTerms[0]} ${originalQuery.split(' ').slice(0, 2).join(' ')}`);
    }
    
    return queries.slice(0, 2); // Limit to 2 search queries per thought
  }
  
  /**
   * Determine if we should search for this thought
   */
  private shouldSearch(thought: string): boolean {
    const searchIndicators = [
      'how', 'what', 'why', 'when', 'where',
      'example', 'best practice', 'documentation',
      'research', 'study', 'evidence', 'data',
      'recent', 'current', 'latest', 'new'
    ];
    
    const lowerThought = thought.toLowerCase();
    return searchIndicators.some(indicator => lowerThought.includes(indicator));
  }
  
  /**
   * Determine if we should create alternative reasoning branches
   */
  private shouldCreateBranches(query: string): boolean {
    const branchIndicators = [
      'complex', 'multiple', 'various', 'different',
      'alternatives', 'options', 'approaches', 'strategies',
      'compare', 'versus', 'vs', 'or'
    ];
    
    const lowerQuery = query.toLowerCase();
    return branchIndicators.some(indicator => lowerQuery.includes(indicator)) ||
           query.split(' ').length > 10; // Complex queries likely benefit from branching
  }
  
  /**
   * Create alternative reasoning paths
   */
  private async createAlternativePaths(
    request: UltraThinkRequest,
    primaryPath: ReasoningPath,
    progressCallback?: (progress: ReasoningProgress) => void
  ): Promise<ReasoningPath[]> {
    const alternatives: ReasoningPath[] = [];
    
    // Create one alternative approach
    progressCallback?.({
      type: 'branch_created',
      message: 'Creating alternative reasoning approach...'
    });
    
    const alternativeRequest = {
      ...request,
      maxThoughts: Math.min(request.maxThoughts || 5, 4), // Shorter for alternatives
    };
    
    try {
      const altPath = await this.createReasoningPath(
        alternativeRequest,
        progressCallback,
        primaryPath.pathId
      );
      alternatives.push(altPath);
    } catch (error) {
      console.warn('Failed to create alternative reasoning path:', error);
    }
    
    return alternatives;
  }
  
  /**
   * Select the best reasoning path based on confidence and completeness
   */
  private selectBestReasoningPath(paths: ReasoningPath[]): ReasoningPath {
    return paths.reduce((best, current) => {
      const currentScore = current.confidence * (current.isComplete ? 1.2 : 1.0);
      const bestScore = best.confidence * (best.isComplete ? 1.2 : 1.0);
      
      return currentScore > bestScore ? current : best;
    });
  }
  
  /**
   * Generate final answer based on the best reasoning path
   */
  private async generateFinalAnswer(
    request: UltraThinkRequest,
    bestPath: ReasoningPath,
    progressCallback?: (progress: ReasoningProgress) => void
  ): Promise<string> {
    progressCallback?.({
      type: 'thought_start',
      message: 'Generating final answer...'
    });
    
    const model = request.model || 'llama-3.3-70b-versatile';
    
    // Compile all thoughts and search results
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
      model: this.groqClient(model),
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
  
  /**
   * Remove duplicate search sources
   */
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

// Export singleton instance
let groqSequentialThinkingInstance: GroqSequentialThinking | null = null;

export function getGroqSequentialThinking(): GroqSequentialThinking {
  if (!groqSequentialThinkingInstance) {
    groqSequentialThinkingInstance = new GroqSequentialThinking();
  }
  return groqSequentialThinkingInstance;
}

/**
 * Convenience function for UltraThink processing
 */
export async function processUltraThink(
  request: UltraThinkRequest,
  progressCallback?: (progress: ReasoningProgress) => void
): Promise<UltraThinkResponse> {
  const engine = getGroqSequentialThinking();
  return engine.processUltraThink(request, progressCallback);
}