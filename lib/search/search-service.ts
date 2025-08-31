/**
 * Internal Search Service
 * 
 * This service provides AI agents with access to web search capabilities
 * while abstracting away the implementation details of the Brave API.
 */

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  thumbnail?: {
    src: string;
  };
  type?: 'web' | 'news' | 'image' | 'video';
  relevanceScore?: number;
}

export interface SearchOptions {
  count?: number;
  offset?: number;
  language?: string;
  country?: string;
  safesearch?: 'strict' | 'moderate' | 'off';
  searchType?: 'web' | 'news' | 'images';
  freshness?: 'day' | 'week' | 'month' | 'year';
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalResults?: number;
  searchTime?: number;
  suggestions?: string[];
  mixed?: any;
}

export class InternalSearchService {
  private braveApiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1/web/search';

  constructor(apiKey?: string) {
    this.braveApiKey = apiKey || process.env.BRAVE_API_KEY || '';
    if (!this.braveApiKey) {
      throw new Error('Brave API key is required for search service');
    }
  }

  /**
   * Perform a web search using the Brave Search API
   * This method is intended for internal use by AI agents only
   */
  async searchWeb(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      const searchUrl = this.buildSearchUrl(query, options);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'X-Subscription-Token': this.braveApiKey,
          'Accept': 'application/json',
          'User-Agent': 'ZapDev-AI-Search/1.0'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Brave Search API error:', response.status, errorText);
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();
      const searchTime = Date.now() - startTime;

      return this.normalizeSearchResponse(data, query, searchTime);
    } catch (error) {
      console.error('Internal search error:', error);
      throw new Error(error instanceof Error ? error.message : 'Search failed');
    }
  }

  /**
   * Search for news articles
   */
  async searchNews(query: string, options: Omit<SearchOptions, 'searchType'> = {}): Promise<SearchResponse> {
    return this.searchWeb(query, { ...options, searchType: 'news' });
  }

  /**
   * Search for recent content (past week)
   */
  async searchRecent(query: string, options: Omit<SearchOptions, 'freshness'> = {}): Promise<SearchResponse> {
    return this.searchWeb(query, { ...options, freshness: 'week' });
  }

  /**
   * Batch search multiple queries
   */
  async batchSearch(queries: string[], options: SearchOptions = {}): Promise<SearchResponse[]> {
    const searchPromises = queries.map(query => this.searchWeb(query, options));
    return Promise.all(searchPromises);
  }

  private buildSearchUrl(query: string, options: SearchOptions): string {
    const url = new URL(this.baseUrl);
    
    url.searchParams.set('q', query);
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

  private normalizeSearchResponse(data: any, query: string, searchTime: number): SearchResponse {
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
    const domain = new URL(result.url).hostname;
    if (trustedDomains.some(trusted => domain.includes(trusted))) {
      score += 15;
    }

    return Math.max(0, score);
  }
}

// Singleton instance for internal use
let searchServiceInstance: InternalSearchService | null = null;

export function getSearchService(): InternalSearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new InternalSearchService();
  }
  return searchServiceInstance;
}

/**
 * Convenience function for AI agents to perform searches
 */
export async function searchForAI(query: string, options?: SearchOptions): Promise<SearchResponse> {
  const service = getSearchService();
  return service.searchWeb(query, options);
}