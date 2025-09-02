/**
 * Enhanced AI Processor with Brave Search Integration
 * 
 * This service integrates Brave search capabilities directly into the AI processing pipeline,
 * allowing background agents to search for information autonomously.
 */

import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getInternalBraveSearch, internalSearch, internalContextSearch } from '@/lib/search/internal-brave-search';
import type { SearchResponse, SearchResult } from '@/lib/search/search-service';

// AI Provider Setup
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const googleGenerativeAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export type AIModel = 'claude-3-5-sonnet-20241022' | 'gpt-4o' | 'llama-3.1-70b-versatile' | 'gemini-1.5-pro';

export interface SearchEnhancedRequest {
  prompt: string;
  model?: AIModel;
  includeSearch?: boolean;
  searchQueries?: string[];
  searchContext?: {
    programmingLanguage?: string;
    framework?: string;
    domain?: string;
  };
  maxSearchResults?: number;
  backgroundMode?: boolean;
}

export interface SearchEnhancedResponse {
  content: string;
  searchResults?: SearchResult[];
  searchQueries?: string[];
  processingTime: number;
  tokensUsed?: number;
  model: AIModel;
}

export interface BackgroundAgentTask {
  id: string;
  type: 'research' | 'code-generation' | 'analysis' | 'search-and-summarize';
  prompt: string;
  searchEnabled: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: SearchEnhancedResponse;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Enhanced AI Processor with Search Integration
 */
export class AIProcessorWithSearch {
  private searchService = getInternalBraveSearch();

  constructor() {
    // Verify search service is available
    this.searchService.healthCheck().catch(error => {
      console.warn('Brave search service not available:', error.message);
    });
  }

  /**
   * Process a request with optional search integration
   */
  async processRequest(request: SearchEnhancedRequest): Promise<SearchEnhancedResponse> {
    const startTime = Date.now();
    const model = request.model || 'claude-3-5-sonnet-20241022';
    
    let searchResults: SearchResult[] = [];
    let searchQueries: string[] = [];
    let enhancedPrompt = request.prompt;

    // Step 1: Determine if search is needed
    if (request.includeSearch || this.shouldUseSearch(request.prompt)) {
      try {
        const searchData = await this.performSearch(request);
        searchResults = searchData.results;
        searchQueries = searchData.queries;
        enhancedPrompt = this.enhancePromptWithSearch(request.prompt, searchResults);
      } catch (error) {
        console.warn('Search failed, continuing without search:', error);
        // Continue without search rather than failing
      }
    }

    // Step 2: Generate AI response
    try {
      const aiModel = this.getAIModel(model);
      
      if (request.backgroundMode) {
        // For background mode, use generateText for simpler processing
        const result = await generateText({
          model: aiModel,
          prompt: enhancedPrompt,
          maxTokens: 4000,
          temperature: 0.7,
        });

        return {
          content: result.text,
          searchResults,
          searchQueries,
          processingTime: Date.now() - startTime,
          tokensUsed: result.usage?.totalTokens,
          model
        };
      } else {
        // For regular mode, we would use streamText, but for this implementation
        // we'll use generateText as well for consistency
        const result = await generateText({
          model: aiModel,
          prompt: enhancedPrompt,
          maxTokens: 4000,
          temperature: 0.7,
        });

        return {
          content: result.text,
          searchResults,
          searchQueries,
          processingTime: Date.now() - startTime,
          tokensUsed: result.usage?.totalTokens,
          model
        };
      }
    } catch (error) {
      throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process multiple requests in background (for background agents)
   */
  async processBackgroundTasks(tasks: BackgroundAgentTask[]): Promise<BackgroundAgentTask[]> {
    const processedTasks = await Promise.allSettled(
      tasks.map(async (task) => {
        try {
          task.status = 'processing';
          
          const request: SearchEnhancedRequest = {
            prompt: task.prompt,
            includeSearch: task.searchEnabled,
            backgroundMode: true,
            maxSearchResults: 5
          };

          const result = await this.processRequest(request);
          
          return {
            ...task,
            status: 'completed' as const,
            result,
            completedAt: new Date()
          };
        } catch (error) {
          return {
            ...task,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          };
        }
      })
    );

    return processedTasks.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    );
  }

  /**
   * Intelligent search query generation from user prompt
   */
  private async generateSearchQueries(prompt: string): Promise<string[]> {
    try {
      const queryGenPrompt = `
Based on this user request, generate 2-3 specific search queries that would help provide better information:

User request: "${prompt}"

Generate search queries that would find:
1. Recent technical information or documentation
2. Code examples or best practices
3. Troubleshooting or solutions

Return only the search queries, one per line, without numbering or explanation.
`;

      const result = await generateText({
        model: this.getAIModel('claude-3-5-sonnet-20241022'),
        prompt: queryGenPrompt,
        maxTokens: 200,
        temperature: 0.5,
      });

      return result.text
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0)
        .slice(0, 3);
    } catch (error) {
      console.warn('Failed to generate search queries:', error);
      return [prompt]; // Fallback to using the original prompt
    }
  }

  /**
   * Perform search based on request
   */
  private async performSearch(request: SearchEnhancedRequest): Promise<{
    results: SearchResult[];
    queries: string[];
  }> {
    let queries = request.searchQueries || [];
    
    // If no queries provided, generate them
    if (queries.length === 0) {
      queries = await this.generateSearchQueries(request.prompt);
    }

    const maxResults = request.maxSearchResults || 10;
    const results: SearchResult[] = [];

    // Perform searches
    for (const query of queries.slice(0, 3)) { // Limit to 3 queries
      try {
        let searchResponse: SearchResponse;
        
        if (request.searchContext) {
          searchResponse = await internalContextSearch(query, request.searchContext, { 
            count: Math.ceil(maxResults / queries.length) 
          });
        } else {
          searchResponse = await internalSearch(query, { 
            count: Math.ceil(maxResults / queries.length) 
          });
        }
        
        results.push(...searchResponse.results.slice(0, 3)); // Max 3 results per query
      } catch (error) {
        console.warn(`Search failed for query "${query}":`, error);
      }
    }

    return {
      results: results.slice(0, maxResults),
      queries
    };
  }

  /**
   * Determine if a prompt would benefit from search
   */
  private shouldUseSearch(prompt: string): boolean {
    const searchIndicators = [
      'how to', 'best practices', 'latest', 'recent', 'current',
      'documentation', 'tutorial', 'example', 'guide',
      'what is', 'explain', 'research', 'find information',
      'compare', 'vs', 'difference between', 'alternatives',
      'error', 'problem', 'issue', 'troubleshoot',
      'new features', 'updates', 'changelog'
    ];

    const programmingIndicators = [
      'react', 'javascript', 'typescript', 'python', 'node',
      'api', 'library', 'framework', 'package', 'npm',
      'github', 'stackoverflow', 'docs'
    ];

    const promptLower = prompt.toLowerCase();
    
    return searchIndicators.some(indicator => promptLower.includes(indicator)) ||
           programmingIndicators.some(indicator => promptLower.includes(indicator));
  }

  /**
   * Enhance prompt with search results
   */
  private enhancePromptWithSearch(originalPrompt: string, searchResults: SearchResult[]): string {
    if (searchResults.length === 0) {
      return originalPrompt;
    }

    const searchContext = searchResults
      .slice(0, 5) // Limit to top 5 results
      .map(result => `
**${result.title}**
URL: ${result.url}
${result.description}
`)
      .join('\n');

    return `${originalPrompt}

I have searched for relevant information and found these results:

${searchContext}

Please use this information to provide a more accurate and up-to-date response. Cite sources when relevant.`;
  }

  /**
   * Get the appropriate AI model instance
   */
  private getAIModel(modelName: AIModel) {
    switch (modelName) {
      case 'claude-3-5-sonnet-20241022':
        return anthropic('claude-3-5-sonnet-20241022');
      case 'gpt-4o':
        return openai('gpt-4o');
      case 'llama-3.1-70b-versatile':
        return groq('llama-3.1-70b-versatile');
      case 'gemini-1.5-pro':
        return googleGenerativeAI('gemini-1.5-pro');
      default:
        return anthropic('claude-3-5-sonnet-20241022');
    }
  }

  /**
   * Health check for the processor
   */
  async healthCheck(): Promise<{
    aiModels: boolean;
    searchService: boolean;
    overall: boolean;
  }> {
    const searchHealth = await this.searchService.healthCheck();
    
    // Test AI model with a simple query
    let aiHealth = false;
    try {
      await generateText({
        model: this.getAIModel('claude-3-5-sonnet-20241022'),
        prompt: 'Hello',
        maxTokens: 10
      });
      aiHealth = true;
    } catch (error) {
      console.warn('AI model health check failed:', error);
    }

    return {
      aiModels: aiHealth,
      searchService: searchHealth,
      overall: aiHealth && searchHealth
    };
  }

  /**
   * Get processor statistics
   */
  getStats(): {
    searchServiceStats: any;
    supportedModels: AIModel[];
  } {
    return {
      searchServiceStats: this.searchService.getStats(),
      supportedModels: ['claude-3-5-sonnet-20241022', 'gpt-4o', 'llama-3.1-70b-versatile', 'gemini-1.5-pro']
    };
  }
}

// Singleton instance
let processorInstance: AIProcessorWithSearch | null = null;

export function getAIProcessorWithSearch(): AIProcessorWithSearch {
  if (!processorInstance) {
    processorInstance = new AIProcessorWithSearch();
  }
  return processorInstance;
}

/**
 * Convenience functions for background agents
 */
export async function processWithSearch(
  prompt: string,
  options: Partial<SearchEnhancedRequest> = {}
): Promise<SearchEnhancedResponse> {
  const processor = getAIProcessorWithSearch();
  return processor.processRequest({
    prompt,
    includeSearch: true,
    ...options
  });
}

export async function processBackgroundTask(
  task: BackgroundAgentTask
): Promise<BackgroundAgentTask> {
  const processor = getAIProcessorWithSearch();
  const results = await processor.processBackgroundTasks([task]);
  return results[0];
}

export async function createSearchEnabledTask(
  prompt: string,
  type: BackgroundAgentTask['type'] = 'research'
): Promise<BackgroundAgentTask> {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    prompt,
    searchEnabled: true,
    status: 'pending',
    createdAt: new Date()
  };
}