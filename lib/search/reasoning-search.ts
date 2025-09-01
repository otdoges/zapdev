/**
 * Search-Powered Reasoning Module
 * 
 * Integrates search capabilities with the reasoning process to provide
 * fact-based, well-researched AI reasoning with source attribution.
 */

import { getAISearchProcessor, SearchContext, ProcessedSearchResult } from './ai-search-processor';
import { getSearchService } from './search-service';

export interface ReasoningSearchRequest {
  query: string;
  maxResults?: number;
  relevanceThreshold?: number;
  searchTimeout?: number;
  context?: {
    originalQuery: string;
    currentStep: number;
    previousFindings: string[];
    domain?: string;
    priority?: 'speed' | 'accuracy' | 'comprehensive';
  };
}

export interface ReasoningSearchResult {
  title: string;
  url: string;
  description: string;
  snippet?: string;
  relevanceScore: number;
  timestamp?: string;
  domain: string;
  trustScore: number;
  keyFacts: string[];
  relatedConcepts: string[];
}

export interface SearchAugmentedInsight {
  insight: string;
  confidence: number;
  sources: ReasoningSearchResult[];
  factualBasis: string[];
  contradictions?: string[];
  needsMoreResearch: boolean;
}

export class ReasoningSearchService {
  private searchProcessor = getAISearchProcessor();
  private searchService = getSearchService();
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_CONCURRENT_SEARCHES = 3;

  /**
   * Search for information to support reasoning
   */
  async searchForReasoning(
    query: string,
    options: ReasoningSearchRequest = {}
  ): Promise<ReasoningSearchResult[]> {
    const {
      maxResults = 5,
      relevanceThreshold = 0.6,
      searchTimeout = this.DEFAULT_TIMEOUT,
      context
    } = options;

    try {
      // Generate optimized search queries for reasoning
      const searchQueries = this.generateReasoningQueries(query, context);
      
      // Perform searches with timeout
      const searchPromises = searchQueries.slice(0, this.MAX_CONCURRENT_SEARCHES).map(searchQuery =>
        this.performTimedSearch(searchQuery, searchTimeout, context)
      );

      const searchResults = await Promise.allSettled(searchPromises);
      
      // Combine and process results
      const allResults: ProcessedSearchResult[] = [];
      searchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.results) {
          allResults.push(...result.value.results);
        }
      });

      // Convert to reasoning format and filter by relevance
      const reasoningResults = this.convertToReasoningResults(allResults, query);
      
      return reasoningResults
        .filter(result => result.relevanceScore >= relevanceThreshold)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

    } catch (error) {
      console.warn('Reasoning search failed:', error);
      return [];
    }
  }

  /**
   * Augment an insight with search-backed evidence
   */
  async augmentInsightWithSearch(
    insight: string,
    originalQuery: string,
    maxSources = 3
  ): Promise<SearchAugmentedInsight> {
    try {
      // Search for evidence supporting the insight
      const searchResults = await this.searchForReasoning(insight, {
        maxResults: maxSources * 2, // Get more results to select best ones
        context: {
          originalQuery,
          currentStep: 1,
          previousFindings: [],
          priority: 'accuracy'
        }
      });

      // Extract factual basis from search results
      const factualBasis = this.extractFactualBasis(searchResults, insight);
      
      // Check for contradictions
      const contradictions = this.findContradictions(searchResults, insight);
      
      // Calculate confidence based on search support
      const confidence = this.calculateSearchBasedConfidence(
        insight, 
        searchResults, 
        factualBasis, 
        contradictions
      );

      return {
        insight,
        confidence,
        sources: searchResults.slice(0, maxSources),
        factualBasis,
        contradictions: contradictions.length > 0 ? contradictions : undefined,
        needsMoreResearch: confidence < 70 || factualBasis.length < 2
      };

    } catch (error) {
      console.warn('Insight augmentation failed:', error);
      return {
        insight,
        confidence: 50, // Low confidence without search support
        sources: [],
        factualBasis: [],
        needsMoreResearch: true
      };
    }
  }

  /**
   * Search for fact-checking information
   */
  async factCheckClaim(
    claim: string,
    context?: string
  ): Promise<{
    isSupported: boolean;
    confidence: number;
    supportingEvidence: ReasoningSearchResult[];
    contradictingEvidence: ReasoningSearchResult[];
    neutralEvidence: ReasoningSearchResult[];
  }> {
    try {
      // Generate fact-checking queries
      const factCheckQueries = [
        `${claim} fact check`,
        `${claim} evidence research`,
        `is "${claim}" true`,
        context ? `${claim} ${context}` : claim
      ].filter(Boolean);

      // Perform searches
      const searchResults = await this.searchForReasoning(factCheckQueries.join(' '), {
        maxResults: 10,
        context: {
          originalQuery: claim,
          currentStep: 1,
          previousFindings: [],
          priority: 'accuracy'
        }
      });

      // Categorize evidence
      const supportingEvidence: ReasoningSearchResult[] = [];
      const contradictingEvidence: ReasoningSearchResult[] = [];
      const neutralEvidence: ReasoningSearchResult[] = [];

      searchResults.forEach(result => {
        const sentiment = this.analyzeClaimSupport(result, claim);
        if (sentiment > 0.6) {
          supportingEvidence.push(result);
        } else if (sentiment < 0.4) {
          contradictingEvidence.push(result);
        } else {
          neutralEvidence.push(result);
        }
      });

      // Calculate overall support
      const totalEvidence = supportingEvidence.length + contradictingEvidence.length;
      const supportRatio = totalEvidence > 0 ? supportingEvidence.length / totalEvidence : 0.5;
      
      return {
        isSupported: supportRatio > 0.6,
        confidence: Math.round(supportRatio * 100),
        supportingEvidence,
        contradictingEvidence,
        neutralEvidence
      };

    } catch (error) {
      console.warn('Fact checking failed:', error);
      return {
        isSupported: false,
        confidence: 0,
        supportingEvidence: [],
        contradictingEvidence: [],
        neutralEvidence: []
      };
    }
  }

  /**
   * Generate optimized search queries for reasoning context
   */
  private generateReasoningQueries(
    query: string, 
    context?: ReasoningSearchRequest['context']
  ): string[] {
    const queries: string[] = [query];

    // Add context-enhanced queries
    if (context?.originalQuery && context.originalQuery !== query) {
      queries.push(`${query} ${context.originalQuery}`);
    }

    // Add domain-specific search if context provided
    if (context?.domain) {
      queries.push(`${query} site:${context.domain}`);
    }

    // Add research-oriented queries
    queries.push(`${query} research study`);
    queries.push(`${query} evidence data`);
    
    // Add recent information if needed
    const currentYear = new Date().getFullYear();
    queries.push(`${query} ${currentYear}`);

    return queries.slice(0, 4); // Limit to prevent too many searches
  }

  /**
   * Perform search with timeout
   */
  private async performTimedSearch(
    query: string,
    timeout: number,
    context?: ReasoningSearchRequest['context']
  ): Promise<any> {
    return Promise.race([
      this.searchProcessor.processSearch(query, this.buildSearchContext(context)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Search timeout')), timeout)
      )
    ]);
  }

  /**
   * Build search context from reasoning context
   */
  private buildSearchContext(context?: ReasoningSearchRequest['context']): SearchContext {
    return {
      userProject: context?.originalQuery,
      userSkillLevel: 'advanced', // Reasoning searches are typically advanced
      searchHistory: context?.previousFindings || []
    };
  }

  /**
   * Convert processed search results to reasoning format
   */
  private convertToReasoningResults(
    searchResults: ProcessedSearchResult[],
    originalQuery: string
  ): ReasoningSearchResult[] {
    return searchResults.map(result => {
      const domain = this.extractDomain(result.url);
      const trustScore = this.calculateTrustScore(result, domain);
      const keyFacts = result.keyPoints || this.extractKeyFacts(result.description);
      
      return {
        title: result.title,
        url: result.url,
        description: result.description,
        snippet: result.aiSummary,
        relevanceScore: result.relevanceScore / 100, // Normalize to 0-1
        timestamp: result.age,
        domain,
        trustScore,
        keyFacts,
        relatedConcepts: result.tags || []
      };
    });
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Calculate trust score based on source characteristics
   */
  private calculateTrustScore(result: ProcessedSearchResult, domain: string): number {
    let score = 50; // Base score

    // Boost for authoritative domains
    const authoritativeDomains = [
      'wikipedia.org', 'britannica.com', 'nature.com', 'science.org',
      'pubmed.ncbi.nlm.nih.gov', 'scholar.google.com', 'arxiv.org',
      'github.com', 'stackoverflow.com', 'docs.microsoft.com',
      'developer.mozilla.org', 'w3.org'
    ];

    if (authoritativeDomains.some(authDomain => domain.includes(authDomain))) {
      score += 30;
    }

    // Boost for documentation and educational content
    if (result.category === 'documentation') score += 20;
    if (result.category === 'tutorial') score += 10;

    // Boost for recent content
    if (result.age && result.age.includes('hour')) score += 10;
    if (result.age && result.age.includes('day')) score += 5;

    return Math.min(100, score);
  }

  /**
   * Extract factual basis from search results
   */
  private extractFactualBasis(
    searchResults: ReasoningSearchResult[],
    insight: string
  ): string[] {
    const facts: string[] = [];
    
    searchResults.forEach(result => {
      // Extract key facts that support the insight
      result.keyFacts.forEach(fact => {
        if (this.isRelevantToInsight(fact, insight)) {
          facts.push(`${fact} (Source: ${result.domain})`);
        }
      });
    });

    return [...new Set(facts)]; // Remove duplicates
  }

  /**
   * Find contradictions in search results
   */
  private findContradictions(
    searchResults: ReasoningSearchResult[],
    insight: string
  ): string[] {
    const contradictions: string[] = [];
    
    // Look for contradictory information
    const contradictoryWords = ['however', 'but', 'contrary', 'although', 'despite', 'not'];
    
    searchResults.forEach(result => {
      const content = result.description.toLowerCase();
      if (contradictoryWords.some(word => content.includes(word))) {
        // Extract sentences with contradictory markers
        const sentences = result.description.split(/[.!?]+/);
        sentences.forEach(sentence => {
          if (contradictoryWords.some(word => sentence.toLowerCase().includes(word))) {
            contradictions.push(`${sentence.trim()} (Source: ${result.domain})`);
          }
        });
      }
    });

    return contradictions.slice(0, 3); // Limit to most relevant contradictions
  }

  /**
   * Calculate confidence based on search support
   */
  private calculateSearchBasedConfidence(
    insight: string,
    searchResults: ReasoningSearchResult[],
    factualBasis: string[],
    contradictions: string[]
  ): number {
    let confidence = 50; // Base confidence

    // Boost for factual support
    confidence += Math.min(30, factualBasis.length * 10);

    // Boost for high-quality sources
    const avgTrustScore = searchResults.reduce((sum, r) => sum + r.trustScore, 0) / searchResults.length;
    confidence += (avgTrustScore - 50) / 2; // Normalize trust score impact

    // Reduce for contradictions
    confidence -= contradictions.length * 15;

    // Boost for multiple corroborating sources
    if (searchResults.length >= 3) confidence += 10;

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Check if fact is relevant to insight
   */
  private isRelevantToInsight(fact: string, insight: string): boolean {
    const factWords = fact.toLowerCase().split(/\W+/);
    const insightWords = insight.toLowerCase().split(/\W+/);
    
    // Check for word overlap
    const overlap = factWords.filter(word => 
      word.length > 3 && insightWords.includes(word)
    );
    
    return overlap.length >= 2; // Require at least 2 meaningful word overlaps
  }

  /**
   * Analyze how well a search result supports a claim
   */
  private analyzeClaimSupport(result: ReasoningSearchResult, claim: string): number {
    const content = `${result.title} ${result.description}`.toLowerCase();
    const claimLower = claim.toLowerCase();
    
    // Simple sentiment analysis for claim support
    let support = 0.5; // Neutral
    
    // Positive indicators
    const positiveWords = ['confirms', 'supports', 'proves', 'shows', 'demonstrates', 'true', 'correct'];
    positiveWords.forEach(word => {
      if (content.includes(word)) support += 0.1;
    });
    
    // Negative indicators  
    const negativeWords = ['false', 'incorrect', 'myth', 'debunked', 'wrong', 'not true'];
    negativeWords.forEach(word => {
      if (content.includes(word)) support -= 0.1;
    });
    
    // Check for direct claim mentions
    if (content.includes(claimLower)) {
      support += 0.2;
    }
    
    return Math.max(0, Math.min(1, support));
  }

  /**
   * Extract key facts from description
   */
  private extractKeyFacts(description: string): string[] {
    // Simple fact extraction - sentences with numbers, dates, or definitive statements
    const sentences = description.split(/[.!?]+/);
    const facts = sentences.filter(sentence => {
      const s = sentence.trim();
      return s.length > 20 && (
        /\d+/.test(s) || // Contains numbers
        /\d{4}/.test(s) || // Contains years
        /percent|%/.test(s) || // Contains percentages
        /according to|research shows|study found/i.test(s) // Authority phrases
      );
    });
    
    return facts.slice(0, 3).map(f => f.trim());
  }
}

// Export singleton instance
let reasoningSearchServiceInstance: ReasoningSearchService | null = null;

export function getReasoningSearchService(): ReasoningSearchService {
  if (!reasoningSearchServiceInstance) {
    reasoningSearchServiceInstance = new ReasoningSearchService();
  }
  return reasoningSearchServiceInstance;
}

/**
 * Convenience functions for reasoning search
 */
export async function searchForReasoning(
  query: string,
  options?: ReasoningSearchRequest
): Promise<ReasoningSearchResult[]> {
  const service = getReasoningSearchService();
  return service.searchForReasoning(query, options);
}

export async function augmentWithEvidence(
  insight: string,
  originalQuery: string
): Promise<SearchAugmentedInsight> {
  const service = getReasoningSearchService();
  return service.augmentInsightWithSearch(insight, originalQuery);
}