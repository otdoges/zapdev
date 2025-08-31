/**
 * AI Search Result Processor
 * 
 * This module processes raw search results through AI to provide
 * enhanced, categorized, and user-friendly search experiences.
 */

import { SearchResult, SearchResponse, getSearchService } from './search-service';
import { getSearchCache } from './search-cache';

export interface ProcessedSearchResult extends SearchResult {
  category: 'documentation' | 'tutorial' | 'code' | 'news' | 'tool' | 'general';
  relevanceScore: number;
  aiSummary?: string;
  keyPoints?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  similarResults?: string[];
}

export interface EnhancedSearchResponse {
  results: ProcessedSearchResult[];
  query: string;
  totalResults?: number;
  searchTime?: number;
  aiSummary: string;
  suggestedQueries: string[];
  categories: {
    [category: string]: number;
  };
  insights?: {
    trendingTopics?: string[];
    recommendedActions?: string[];
    learningPath?: string[];
  };
}

export interface SearchContext {
  userProject?: string;
  programmingLanguage?: string;
  framework?: string;
  userSkillLevel?: 'beginner' | 'intermediate' | 'advanced';
  searchHistory?: string[];
}

export class AISearchProcessor {
  private searchService = getSearchService();
  private cache = getSearchCache();

  /**
   * Process a search query through AI enhancement
   */
  async processSearch(
    query: string, 
    context: SearchContext = {}
  ): Promise<EnhancedSearchResponse> {
    try {
      // First, get raw search results
      const rawResults = await this.searchService.searchWeb(query, {
        count: 15, // Get more results for better processing
      });

      // Process and enhance the results
      const processedResults = await this.enhanceSearchResults(rawResults.results, query, context);
      
      // Generate AI summary and insights
      const aiSummary = this.generateSearchSummary(processedResults, query, context);
      const suggestedQueries = this.generateSuggestedQueries(query, processedResults, context);
      const categories = this.categorizeResults(processedResults);
      const insights = this.generateInsights(processedResults, query, context);

      return {
        results: processedResults.slice(0, 10), // Return top 10 processed results
        query: rawResults.query,
        totalResults: rawResults.totalResults,
        searchTime: rawResults.searchTime,
        aiSummary,
        suggestedQueries,
        categories,
        insights
      };
    } catch (error) {
      console.error('AI search processing error:', error);
      throw new Error('Failed to process search results');
    }
  }

  /**
   * Multi-step search for complex queries
   */
  async deepSearch(
    query: string, 
    context: SearchContext = {}
  ): Promise<EnhancedSearchResponse> {
    const searchQueries = this.generateDeepSearchQueries(query, context);
    
    // Perform multiple searches
    const searchPromises = searchQueries.map(q => 
      this.searchService.searchWeb(q, { count: 5 })
    );
    
    const allResults = await Promise.all(searchPromises);
    
    // Combine and deduplicate results
    const combinedResults = this.combineAndDeduplicateResults(allResults);
    
    // Process combined results
    const processedResults = await this.enhanceSearchResults(combinedResults, query, context);
    
    return {
      results: processedResults.slice(0, 10),
      query,
      totalResults: combinedResults.length,
      searchTime: 0,
      aiSummary: this.generateSearchSummary(processedResults, query, context),
      suggestedQueries: this.generateSuggestedQueries(query, processedResults, context),
      categories: this.categorizeResults(processedResults),
      insights: this.generateInsights(processedResults, query, context)
    };
  }

  private async enhanceSearchResults(
    results: SearchResult[],
    query: string,
    context: SearchContext
  ): Promise<ProcessedSearchResult[]> {
    return results.map((result, index) => {
      const category = this.categorizeResult(result, query, context);
      const tags = this.generateTags(result, query, context);
      const difficulty = this.assessDifficulty(result, context);
      
      return {
        ...result,
        category,
        relevanceScore: this.calculateEnhancedRelevance(result, query, context, index),
        tags,
        difficulty,
        keyPoints: this.extractKeyPoints(result),
        aiSummary: this.generateResultSummary(result, category)
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private categorizeResult(
    result: SearchResult, 
    query: string, 
    context: SearchContext
  ): ProcessedSearchResult['category'] {
    const title = result.title.toLowerCase();
    const description = result.description.toLowerCase();
    const url = result.url.toLowerCase();
    
    // Documentation
    if (url.includes('docs.') || url.includes('documentation') || 
        title.includes('documentation') || title.includes('api reference')) {
      return 'documentation';
    }
    
    // Tutorials and guides
    if (title.includes('tutorial') || title.includes('guide') || 
        title.includes('how to') || title.includes('getting started')) {
      return 'tutorial';
    }
    
    // Code repositories and examples
    let parsedHost: string | undefined;
    try {
      parsedHost = (new URL(result.url)).hostname.toLowerCase();
    } catch (e) {
      parsedHost = undefined;
    }
    if ((parsedHost === 'github.com' || parsedHost === 'gitlab.com') ||
        title.includes('example') || title.includes('sample code')) {
      return 'code';
    }
    
    // News and updates
    if (result.age && (result.age.includes('hour') || result.age.includes('day')) ||
        url.includes('blog') || url.includes('news')) {
      return 'news';
    }
    
    // Tools and utilities
    if (title.includes('tool') || title.includes('utility') || 
        url.includes('tools') || description.includes('tool')) {
      return 'tool';
    }
    
    return 'general';
  }

  private generateTags(result: SearchResult, query: string, context: SearchContext): string[] {
    const tags: Set<string> = new Set();
    
    // Add programming language tags
    const languages = ['javascript', 'typescript', 'python', 'java', 'react', 'node', 'vue', 'angular'];
    languages.forEach(lang => {
      if (result.title.toLowerCase().includes(lang) || 
          result.description.toLowerCase().includes(lang)) {
        tags.add(lang);
      }
    });
    
    // Add framework tags
    const frameworks = ['react', 'vue', 'angular', 'express', 'next', 'nuxt', 'svelte'];
    frameworks.forEach(framework => {
      if (result.title.toLowerCase().includes(framework) || 
          result.description.toLowerCase().includes(framework)) {
        tags.add(framework);
      }
    });
    
    // Add context-based tags
    if (context.programmingLanguage) {
      tags.add(context.programmingLanguage.toLowerCase());
    }
    if (context.framework) {
      tags.add(context.framework.toLowerCase());
    }
    
    // Add difficulty indicators
    if (result.title.toLowerCase().includes('beginner') || 
        result.title.toLowerCase().includes('getting started')) {
      tags.add('beginner-friendly');
    }
    if (result.title.toLowerCase().includes('advanced') || 
        result.title.toLowerCase().includes('expert')) {
      tags.add('advanced');
    }
    
    return Array.from(tags);
  }

  private assessDifficulty(result: SearchResult, context: SearchContext): ProcessedSearchResult['difficulty'] {
    const title = result.title.toLowerCase();
    const description = result.description.toLowerCase();
    
    if (title.includes('beginner') || title.includes('getting started') || 
        title.includes('intro') || title.includes('basics')) {
      return 'beginner';
    }
    
    if (title.includes('advanced') || title.includes('expert') || 
        title.includes('deep dive') || description.includes('advanced')) {
      return 'advanced';
    }
    
    return 'intermediate';
  }

  private calculateEnhancedRelevance(
    result: SearchResult, 
    query: string, 
    context: SearchContext, 
    index: number
  ): number {
    let score = result.relevanceScore || (100 - index);
    
    // Boost based on category relevance
    if (context.programmingLanguage) {
      const lang = context.programmingLanguage.toLowerCase();
      if (result.title.toLowerCase().includes(lang) || 
          result.description.toLowerCase().includes(lang)) {
        score += 20;
      }
    }
    
    // Boost documentation and tutorials for development queries
    const category = this.categorizeResult(result, query, context);
    if ((query.includes('how') || query.includes('tutorial')) && category === 'tutorial') {
      score += 15;
    }
    if (query.includes('documentation') && category === 'documentation') {
      score += 15;
    }
    
    // Boost recent content for news-related queries
    if (result.age && result.age.includes('hour') && query.includes('latest')) {
      score += 10;
    }
    
    return score;
  }

  private extractKeyPoints(result: SearchResult): string[] {
    const points: string[] = [];
    const description = result.description;
    
    // Simple key point extraction based on sentence structure
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Take up to 3 key sentences
    points.push(...sentences.slice(0, 3).map(s => s.trim()));
    
    return points;
  }

  private generateResultSummary(result: SearchResult, category: ProcessedSearchResult['category']): string {
    switch (category) {
      case 'documentation':
        return `Documentation resource explaining ${result.title.toLowerCase()}. Check here for API details and implementation guides.`;
      case 'tutorial':
        return `Step-by-step tutorial on ${result.title.toLowerCase()}. Great for learning implementation details.`;
      case 'code':
        return `Code example or repository with practical implementation. Review for code patterns and best practices.`;
      case 'tool':
        return `Tool or utility that can help with ${result.title.toLowerCase()}. Consider for your development workflow.`;
      default:
        return result.description.length > 100 ? 
          result.description.substring(0, 100) + '...' : 
          result.description;
    }
  }

  private generateSearchSummary(
    results: ProcessedSearchResult[], 
    query: string, 
    context: SearchContext
  ): string {
    const categories = this.categorizeResults(results);
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    
    if (results.length === 0) {
      return `No results found for "${query}". Try rephrasing your search or using different keywords.`;
    }
    
    let summary = `Found ${results.length} relevant results for "${query}". `;
    
    if (topCategory && topCategory[1] > 0) {
      summary += `Most results are ${topCategory[0]} resources. `;
    }
    
    if (context.programmingLanguage) {
      const langResults = results.filter(r => 
        r.tags.includes(context.programmingLanguage!.toLowerCase())
      ).length;
      if (langResults > 0) {
        summary += `${langResults} results are specifically related to ${context.programmingLanguage}. `;
      }
    }
    
    return summary;
  }

  private generateSuggestedQueries(
    originalQuery: string, 
    results: ProcessedSearchResult[], 
    context: SearchContext
  ): string[] {
    const suggestions: Set<string> = new Set();
    
    // Add context-based suggestions
    if (context.programmingLanguage) {
      suggestions.add(`${originalQuery} ${context.programmingLanguage} example`);
      suggestions.add(`${originalQuery} ${context.programmingLanguage} best practices`);
    }
    
    // Add category-based suggestions
    if (results.some(r => r.category === 'tutorial')) {
      suggestions.add(`${originalQuery} step by step tutorial`);
    }
    if (results.some(r => r.category === 'code')) {
      suggestions.add(`${originalQuery} code examples`);
    }
    if (results.some(r => r.category === 'documentation')) {
      suggestions.add(`${originalQuery} API documentation`);
    }
    
    // Add level-based suggestions
    suggestions.add(`${originalQuery} beginner guide`);
    suggestions.add(`${originalQuery} advanced techniques`);
    
    return Array.from(suggestions).slice(0, 5);
  }

  private categorizeResults(results: ProcessedSearchResult[]): { [category: string]: number } {
    const categories: { [category: string]: number } = {};
    
    results.forEach(result => {
      categories[result.category] = (categories[result.category] || 0) + 1;
    });
    
    return categories;
  }

  private generateInsights(
    results: ProcessedSearchResult[], 
    query: string, 
    context: SearchContext
  ): EnhancedSearchResponse['insights'] {
    const tags = results.flatMap(r => r.tags);
    const trendingTopics = this.getMostCommonTags(tags).slice(0, 3);
    
    const recommendedActions: string[] = [];
    if (results.some(r => r.category === 'tutorial')) {
      recommendedActions.push('Start with tutorial resources to build foundational knowledge');
    }
    if (results.some(r => r.category === 'documentation')) {
      recommendedActions.push('Review official documentation for comprehensive details');
    }
    if (results.some(r => r.category === 'code')) {
      recommendedActions.push('Examine code examples to understand implementation patterns');
    }
    
    const learningPath: string[] = [];
    const beginnerResults = results.filter(r => r.difficulty === 'beginner');
    const intermediateResults = results.filter(r => r.difficulty === 'intermediate');
    const advancedResults = results.filter(r => r.difficulty === 'advanced');
    
    if (beginnerResults.length > 0) learningPath.push('Begin with fundamentals and basic concepts');
    if (intermediateResults.length > 0) learningPath.push('Progress to practical implementation');
    if (advancedResults.length > 0) learningPath.push('Explore advanced techniques and optimization');
    
    return {
      trendingTopics,
      recommendedActions,
      learningPath
    };
  }

  private getMostCommonTags(tags: string[]): string[] {
    const tagCounts: { [tag: string]: number } = {};
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }

  private generateDeepSearchQueries(query: string, context: SearchContext): string[] {
    const queries = [query];
    
    // Add context-enhanced queries
    if (context.programmingLanguage) {
      queries.push(`${query} ${context.programmingLanguage}`);
    }
    if (context.framework) {
      queries.push(`${query} ${context.framework}`);
    }
    
    // Add specific search types
    queries.push(`${query} tutorial`);
    queries.push(`${query} documentation`);
    queries.push(`${query} examples`);
    
    return queries.slice(0, 5); // Limit to 5 queries
  }

  private combineAndDeduplicateResults(searchResponses: SearchResponse[]): SearchResult[] {
    const seenUrls = new Set<string>();
    const combinedResults: SearchResult[] = [];
    
    searchResponses.forEach(response => {
      response.results.forEach(result => {
        if (!seenUrls.has(result.url)) {
          seenUrls.add(result.url);
          combinedResults.push(result);
        }
      });
    });
    
    return combinedResults;
  }
}

// Export singleton instance
let aiProcessorInstance: AISearchProcessor | null = null;

export function getAISearchProcessor(): AISearchProcessor {
  if (!aiProcessorInstance) {
    aiProcessorInstance = new AISearchProcessor();
  }
  return aiProcessorInstance;
}

/**
 * Convenience function for AI-processed search
 */
export async function aiSearch(query: string, context?: SearchContext): Promise<EnhancedSearchResponse> {
  const processor = getAISearchProcessor();
  return processor.processSearch(query, context);
}