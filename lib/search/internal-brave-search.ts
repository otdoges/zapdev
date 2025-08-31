/**
 * Internal Brave Search Service
 * 
 * This service is for AI-only usage and provides programmatic access
 * to search functionality without any UI components.
 * 
 * NOTE: This replaces the old BraveSearch React component for internal use.
 */

import { SearchResult, SearchResponse, SearchOptions } from './search-service';

export interface InternalBraveSearchOptions extends SearchOptions {
  count?: number;
  offset?: number;
  language?: string;
  country?: string;
  safesearch?: 'strict' | 'moderate' | 'off';
  searchType?: 'web' | 'news' | 'images';
  freshness?: 'day' | 'week' | 'month' | 'year';
}

/**
 * Internal Brave Search Service for AI agents
 * 
 * This class provides direct access to Brave Search API for AI agents
 * without any UI or user interaction components.
 */
export class InternalBraveSearch {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1/web/search';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BRAVE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Brave API key is required for internal search');
    }
  }

  /**
   * Perform a search using Brave API - AI agents only
   */
  async search(query: string, options: InternalBraveSearchOptions = {}): Promise<SearchResponse> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    const startTime = Date.now();

    try {
      const searchUrl = this.buildSearchUrl(query, options);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'X-Subscription-Token': this.apiKey,
          'Accept': 'application/json',
          'User-Agent': 'ZapDev-AI-Internal/1.0'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Brave API error (internal):', response.status, errorText);
        throw new Error(`Internal search API error: ${response.status}`);
      }

      const data = await response.json();
      const searchTime = Date.now() - startTime;

      return this.normalizeResponse(data, query, searchTime);
    } catch (error) {
      console.error('Internal Brave search error:', error);
      throw new Error(error instanceof Error ? error.message : 'Internal search failed');
    }
  }

  /**
   * Batch search for multiple queries - AI agents only
   */
  async batchSearch(queries: string[], options: InternalBraveSearchOptions = {}): Promise<SearchResponse[]> {
    const searchPromises = queries.map(query => this.search(query, options));
    return Promise.allSettled(searchPromises).then(results =>
      results
        .filter((result): result is PromiseFulfilledResult<SearchResponse> => 
          result.status === 'fulfilled')
        .map(result => result.value)
    );
  }

  /**
   * Search for recent content - AI agents only
   */
  async searchRecent(query: string, options: Omit<InternalBraveSearchOptions, 'freshness'> = {}): Promise<SearchResponse> {
    return this.search(query, { ...options, freshness: 'week' });
  }

  /**
   * Search for news - AI agents only
   */
  async searchNews(query: string, options: Omit<InternalBraveSearchOptions, 'searchType'> = {}): Promise<SearchResponse> {
    return this.search(query, { ...options, searchType: 'news' });
  }

  /**
   * Context-aware search for AI agents
   */
  async contextSearch(
    query: string,
    context: {
      programmingLanguage?: string;
      framework?: string;
      domain?: string;
    },
    options: InternalBraveSearchOptions = {}
  ): Promise<SearchResponse> {
    let enhancedQuery = query;
    
    // Enhance query with context
    if (context.programmingLanguage) {
      enhancedQuery += ` ${context.programmingLanguage}`;
    }
    if (context.framework) {
      enhancedQuery += ` ${context.framework}`;
    }
    if (context.domain) {
      enhancedQuery += ` site:${context.domain}`;
    }

    return this.search(enhancedQuery, options);
  }

  private buildSearchUrl(query: string, options: InternalBraveSearchOptions): string {
    const url = new URL(this.baseUrl);
    
    url.searchParams.set('q', query.trim());
    url.searchParams.set('count', (options.count || 10).toString());
    url.searchParams.set('offset', (options.offset || 0).toString());
    url.searchParams.set('search_lang', options.language || 'en');
    url.searchParams.set('country', options.country || 'US');
    url.searchParams.set('safesearch', options.safesearch || 'moderate');

    if (options.freshness) {
      url.searchParams.set('freshness', options.freshness);
    }

    if (options.searchType === 'news') {
      url.searchParams.set('result_filter', 'news');
    } else if (options.searchType === 'images') {
      url.searchParams.set('result_filter', 'images');
    }

    return url.toString();
  }

  private normalizeResponse(data: any, query: string, searchTime: number): SearchResponse {
    const results: SearchResult[] = (data.web?.results || []).map((result: any, index: number) => ({
      title: result.title || '',
      url: result.url || '',
      description: result.description || '',
      age: result.age,
      thumbnail: result.thumbnail,
      type: 'web' as const,
      relevanceScore: this.calculateRelevanceScore(result, query, index)
    }));

    return {
      results: results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)),
      query,
      totalResults: data.web?.totalResults,
      searchTime,
      suggestions: data.query?.altered ? [data.query.original] : undefined,
      mixed: data.mixed
    };
  }

  private calculateRelevanceScore(result: any, query: string, index: number): number {
    let score = 100 - index; // Base score decreases with position
    
    // Boost score for query terms in title
    const queryTerms = query.toLowerCase().split(' ');
    const titleLower = (result.title || '').toLowerCase();
    const descriptionLower = (result.description || '').toLowerCase();
    
    queryTerms.forEach(term => {
      if (titleLower.includes(term)) score += 10;
      if (descriptionLower.includes(term)) score += 5;
    });

    // Boost for recent content
    if (result.age && result.age.includes('hour')) score += 5;
    if (result.age && result.age.includes('day')) score += 3;

    // Boost for trusted domains
    const trustedDomains = ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'docs.microsoft.com'];
    try {
      const domain = new URL(result.url).hostname;
      if (trustedDomains.some(trusted => domain.includes(trusted))) {
        score += 15;
      }
    } catch (error) {
      // Invalid URL, skip domain boost
    }

    return Math.max(0, score);
  }

  /**
   * Health check for the internal search service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.search('test', { count: 1 });
      return result.results.length >= 0; // Even 0 results is a valid response
    } catch (error) {
      console.error('Internal search health check failed:', error);
      return false;
    }
  }

  /**
   * Get search statistics for monitoring
   */
  getStats(): {
    apiKey: string;
    baseUrl: string;
    isConfigured: boolean;
  } {
    return {
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not configured',
      baseUrl: this.baseUrl,
      isConfigured: !!this.apiKey
    };
  }
}

// Singleton instance for internal use
let internalSearchInstance: InternalBraveSearch | null = null;

export function getInternalBraveSearch(): InternalBraveSearch {
  if (!internalSearchInstance) {
    internalSearchInstance = new InternalBraveSearch();
  }
  return internalSearchInstance;
}

/**
 * Convenience functions for AI agents
 */
export async function internalSearch(query: string, options?: InternalBraveSearchOptions): Promise<SearchResponse> {
  const search = getInternalBraveSearch();
  return search.search(query, options);
}

export async function internalBatchSearch(queries: string[], options?: InternalBraveSearchOptions): Promise<SearchResponse[]> {
  const search = getInternalBraveSearch();
  return search.batchSearch(queries, options);
}

export async function internalContextSearch(
  query: string,
  context: {
    programmingLanguage?: string;
    framework?: string;
    domain?: string;
  },
  options?: InternalBraveSearchOptions
): Promise<SearchResponse> {
  const search = getInternalBraveSearch();
  return search.contextSearch(query, context, options);
}