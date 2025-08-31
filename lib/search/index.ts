/**
 * Search System Module
 * 
 * Centralized exports for the enhanced search system that provides
 * AI-powered search capabilities with rate limiting, caching, and
 * subscription management.
 */

// Core search functionality
export {
  InternalSearchService,
  SearchResult,
  SearchResponse,
  SearchOptions,
  getSearchService,
  searchForAI
} from './search-service';

// AI-enhanced search processing
export {
  AISearchProcessor,
  ProcessedSearchResult,
  EnhancedSearchResponse,
  SearchContext,
  getAISearchProcessor,
  aiSearch
} from './ai-search-processor';

// Search result caching
export {
  SearchCache,
  CacheEntry,
  CacheOptions,
  CacheStats,
  getSearchCache,
  cachedSearch
} from './search-cache';

// Rate limiting
export {
  SearchRateLimiter,
  RateLimitConfig,
  RateLimitResult,
  checkSearchRateLimit,
  consumeSearchRateLimit,
  getSearchUsageStats
} from './rate-limiter';

// Subscription and quota management
export {
  SearchSubscriptionManager,
  SubscriptionTier,
  SearchQuota,
  UserSearchUsage,
  useSearchSubscription,
  SEARCH_QUOTAS,
  formatSearchLimit,
  getTimeUntilReset,
  calculateUsagePercentage
} from './subscription-limits';

// Internal Brave Search (AI-only)
export {
  InternalBraveSearch,
  InternalBraveSearchOptions,
  getInternalBraveSearch,
  internalSearch,
  internalBatchSearch,
  internalContextSearch
} from './internal-brave-search';

// Testing utilities
export {
  SearchSystemTester,
  runSearchSystemTests
} from './test-search-system';

/**
 * Search System Overview:
 * 
 * 1. **User-Facing Search**: Components/UserSearch.tsx
 *    - Clean, intuitive interface for end users
 *    - AI-enhanced results with categorization
 *    - Rate limiting and usage display
 * 
 * 2. **AI-Only Search**: Internal search services
 *    - Direct API access for AI agents
 *    - Programmatic search capabilities
 *    - Context-aware search enhancement
 * 
 * 3. **Rate Limiting**: Subscription-based quotas
 *    - Free: 50 searches/day
 *    - Pro: 500 searches/day
 *    - Enterprise: 10,000+ searches/day
 * 
 * 4. **Caching**: Intelligent result caching
 *    - Reduces API costs
 *    - Improves response times
 *    - TTL based on content type
 * 
 * 5. **AI Processing**: Enhanced search results
 *    - Automatic categorization
 *    - Relevance scoring
 *    - Key insight extraction
 *    - Suggested follow-up queries
 * 
 * Usage Examples:
 * 
 * ```typescript
 * // For AI agents (internal use)
 * import { searchForAI } from '@/lib/search';
 * const results = await searchForAI('React hooks tutorial');
 * 
 * // For user-facing features
 * import { aiSearch } from '@/lib/search';
 * const enhanced = await aiSearch('JavaScript best practices', {
 *   programmingLanguage: 'JavaScript',
 *   userSkillLevel: 'intermediate'
 * });
 * 
 * // Check user quotas
 * import { checkSearchRateLimit } from '@/lib/search';
 * const canSearch = await checkSearchRateLimit('deep');
 * ```
 */