/**
 * Search-Enhanced Generation Module
 * 
 * This module provides search-enhanced AI generation that can be integrated 
 * into existing generation routes without breaking changes.
 */

import { streamText, generateText } from 'ai';
import { getInternalBraveSearch, internalSearch } from '@/lib/search/internal-brave-search';
import type { SearchResult } from '@/lib/search/search-service';

interface SearchEnhancementOptions {
  enableSearch?: boolean;
  maxSearchResults?: number;
  searchQueries?: string[];
  programmingContext?: {
    language?: string;
    framework?: string;
    domain?: string;
  };
}

interface SearchEnhancedPrompt {
  originalPrompt: string;
  enhancedPrompt: string;
  searchResults: SearchResult[];
  searchQueries: string[];
  searchEnabled: boolean;
}

/**
 * Determine if a prompt would benefit from web search
 */
export function shouldEnableSearch(prompt: string): boolean {
  const searchIndicators = [
    // Learning and research
    'how to', 'best practices', 'latest', 'recent', 'current', 'new features',
    'documentation', 'tutorial', 'example', 'guide', 'learn about',
    
    // Problem solving
    'error', 'problem', 'issue', 'troubleshoot', 'fix', 'solve', 'debug',
    'not working', 'broken', 'failed', 'exception',
    
    // Comparison and alternatives
    'what is', 'explain', 'compare', 'vs', 'versus', 'difference between',
    'alternatives', 'options', 'choose between',
    
    // Technical queries
    'api', 'library', 'package', 'npm', 'install', 'setup', 'configure',
    'implementation', 'integrate', 'use with', 'works with'
  ];

  const programmingKeywords = [
    'react', 'javascript', 'typescript', 'python', 'node', 'next.js',
    'vue', 'angular', 'svelte', 'css', 'html', 'tailwind',
    'github', 'stackoverflow', 'mdn', 'docs'
  ];

  const promptLower = prompt.toLowerCase();
  
  const hasSearchIndicator = searchIndicators.some(indicator => 
    promptLower.includes(indicator)
  );
  
  const hasProgrammingContext = programmingKeywords.some(keyword => 
    promptLower.includes(keyword)
  );

  // Enable search if we have search indicators or if it's a programming query
  // that might benefit from recent information
  return hasSearchIndicator || (hasProgrammingContext && (
    promptLower.includes('how') || 
    promptLower.includes('what') || 
    promptLower.includes('best') ||
    promptLower.includes('example')
  ));
}

/**
 * Generate search queries from a user prompt
 */
export async function generateSearchQueries(
  prompt: string, 
  aiModel: any,
  maxQueries: number = 3
): Promise<string[]> {
  try {
    const queryGenPrompt = `
Analyze this user request and generate ${maxQueries} specific, targeted search queries that would help provide better, more current information:

User request: "${prompt}"

Generate search queries that would find:
1. Official documentation or recent tutorials
2. Code examples or implementation guides  
3. Common issues, solutions, or troubleshooting

Requirements:
- Make queries specific and targeted
- Focus on recent, authoritative sources
- Include relevant technical terms
- Each query should be 3-8 words

Return only the search queries, one per line:
`;

    const result = await generateText({
      model: aiModel,
      prompt: queryGenPrompt,
      maxTokens: 150,
      temperature: 0.3,
    });

    return result.text
      .split('\n')
      .map(q => q.trim().replace(/^\d+\.?\s*/, '')) // Remove numbering
      .filter(q => q.length > 0 && q.length < 100) // Filter valid queries
      .slice(0, maxQueries);
      
  } catch (error) {
    console.warn('Failed to generate search queries:', error);
    // Fallback: extract key terms from the original prompt
    const words = prompt.toLowerCase().match(/\b\w+\b/g) || [];
    const keyTerms = words
      .filter(word => word.length > 3)
      .slice(0, 5)
      .join(' ');
    return [keyTerms];
  }
}

/**
 * Perform web search for the given queries
 */
export async function performWebSearch(
  queries: string[],
  options: SearchEnhancementOptions = {}
): Promise<SearchResult[]> {
  const maxResults = options.maxSearchResults || 8;
  const results: SearchResult[] = [];
  
  try {
    // Perform searches for each query
    for (const query of queries.slice(0, 3)) { // Limit to 3 queries max
      try {
        const searchResponse = await internalSearch(query, {
          count: Math.ceil(maxResults / queries.length),
          language: 'en',
          safesearch: 'moderate'
        });
        
        results.push(...searchResponse.results.slice(0, 3)); // Max 3 results per query
      } catch (error) {
        console.warn(`Search failed for query "${query}":`, error);
      }
      
      // Add small delay between searches to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Sort by relevance score and remove duplicates
    const uniqueResults = results
      .filter((result, index, arr) => 
        arr.findIndex(r => r.url === result.url) === index
      )
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, maxResults);
    
    return uniqueResults;
    
  } catch (error) {
    console.warn('Web search failed:', error);
    return [];
  }
}

/**
 * Enhance a prompt with search results
 */
export function enhancePromptWithSearchResults(
  originalPrompt: string,
  searchResults: SearchResult[]
): string {
  if (searchResults.length === 0) {
    return originalPrompt;
  }

  // Format search results for AI context
  const searchContext = searchResults
    .slice(0, 5) // Limit to top 5 results to avoid token overflow
    .map((result, index) => `
[${index + 1}] ${result.title}
URL: ${result.url}
${result.description}
${result.age ? `(Published: ${result.age})` : ''}
`)
    .join('\n');

  return `${originalPrompt}

---

I have searched for relevant information and found these recent results:

${searchContext}

Please use this information to provide a more accurate, current, and well-informed response. When referencing information from these sources, you can mention them naturally in your response. Focus on the most relevant and authoritative information.`;
}

/**
 * Create a search-enhanced prompt
 */
export async function createSearchEnhancedPrompt(
  originalPrompt: string,
  options: SearchEnhancementOptions,
  aiModel: any
): Promise<SearchEnhancedPrompt> {
  const searchEnabled = options.enableSearch ?? shouldEnableSearch(originalPrompt);
  
  if (!searchEnabled) {
    return {
      originalPrompt,
      enhancedPrompt: originalPrompt,
      searchResults: [],
      searchQueries: [],
      searchEnabled: false
    };
  }

  try {
    // Generate or use provided search queries
    const searchQueries = options.searchQueries?.length 
      ? options.searchQueries
      : await generateSearchQueries(originalPrompt, aiModel);
    
    // Perform web search
    const searchResults = await performWebSearch(searchQueries, options);
    
    // Enhance prompt with search results
    const enhancedPrompt = enhancePromptWithSearchResults(originalPrompt, searchResults);
    
    return {
      originalPrompt,
      enhancedPrompt,
      searchResults,
      searchQueries,
      searchEnabled: true
    };
    
  } catch (error) {
    console.warn('Search enhancement failed, using original prompt:', error);
    return {
      originalPrompt,
      enhancedPrompt: originalPrompt,
      searchResults: [],
      searchQueries: [],
      searchEnabled: false
    };
  }
}

/**
 * Enhanced streamText that includes search capabilities
 */
export async function streamTextWithSearch(
  aiModel: any,
  originalPrompt: string,
  options: SearchEnhancementOptions & {
    maxTokens?: number;
    temperature?: number;
    system?: string;
  } = {}
) {
  // Create search-enhanced prompt
  const searchEnhanced = await createSearchEnhancedPrompt(originalPrompt, options, aiModel);
  
  // Stream the enhanced response
  const stream = await streamText({
    model: aiModel,
    prompt: searchEnhanced.enhancedPrompt,
    maxTokens: options.maxTokens || 4000,
    temperature: options.temperature || 0.7,
    system: options.system,
  });

  return {
    ...stream,
    searchMetadata: {
      searchEnabled: searchEnhanced.searchEnabled,
      searchQueries: searchEnhanced.searchQueries,
      searchResults: searchEnhanced.searchResults,
      resultCount: searchEnhanced.searchResults.length
    }
  };
}

/**
 * Integration helper for existing generation routes
 */
export class SearchEnhancedGenerator {
  private searchService = getInternalBraveSearch();
  
  async isSearchAvailable(): Promise<boolean> {
    try {
      return await this.searchService.healthCheck();
    } catch {
      return false;
    }
  }
  
  async enhanceGeneration(
    prompt: string,
    aiModel: any,
    options: SearchEnhancementOptions = {}
  ) {
    const searchAvailable = await this.isSearchAvailable();
    
    if (!searchAvailable) {
      console.warn('Search service not available, proceeding without search');
      options.enableSearch = false;
    }
    
    return createSearchEnhancedPrompt(prompt, options, aiModel);
  }
  
  getStats() {
    return this.searchService.getStats();
  }
}

// Singleton instance
let generatorInstance: SearchEnhancedGenerator | null = null;

export function getSearchEnhancedGenerator(): SearchEnhancedGenerator {
  if (!generatorInstance) {
    generatorInstance = new SearchEnhancedGenerator();
  }
  return generatorInstance;
}