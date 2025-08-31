'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessedSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  thumbnail?: { src: string };
  category: 'documentation' | 'tutorial' | 'code' | 'news' | 'tool' | 'general';
  relevanceScore: number;
  aiSummary?: string;
  keyPoints?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface EnhancedSearchResponse {
  results: ProcessedSearchResult[];
  query: string;
  totalResults?: number;
  searchTime?: number;
  processingTime?: number;
  aiSummary: string;
  suggestedQueries: string[];
  categories: { [category: string]: number };
  insights?: {
    trendingTopics?: string[];
    recommendedActions?: string[];
    learningPath?: string[];
  };
  cached?: boolean;
  rateLimit?: {
    remaining: number;
    resetTime: string;
  };
}

interface UserSearchProps {
  onResultSelect?: (result: ProcessedSearchResult) => void;
  compact?: boolean;
  context?: {
    userProject?: string;
    programmingLanguage?: string;
    framework?: string;
    userSkillLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
}

const CATEGORY_COLORS = {
  documentation: 'text-blue-400 bg-blue-900/20 border-blue-700',
  tutorial: 'text-green-400 bg-green-900/20 border-green-700',
  code: 'text-purple-400 bg-purple-900/20 border-purple-700',
  news: 'text-orange-400 bg-orange-900/20 border-orange-700',
  tool: 'text-cyan-400 bg-cyan-900/20 border-cyan-700',
  general: 'text-gray-400 bg-gray-800/50 border-gray-600'
};

const DIFFICULTY_COLORS = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400'
};

export default function UserSearch({ onResultSelect, compact = false, context = {} }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EnhancedSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'smart' | 'deep' | 'quick'>('smart');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInsights, setShowInsights] = useState(true);
  const [usageStats, setUsageStats] = useState<{ remaining: number; resetTime?: string } | null>(null);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load usage stats on mount
  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const response = await fetch('/api/search/query?action=usage');
      if (response.ok) {
        const data = await response.json();
        setUsageStats({
          remaining: data.usage.remaining,
          resetTime: data.usage.resetTime
        });
      }
    } catch (error) {
      console.warn('Failed to load usage stats:', error);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    // Cancel any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    setSelectedCategory('all');
    
    try {
      const response = await fetch('/api/search/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: query.trim(),
          searchType,
          context
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Try again after ${new Date(data.retryAfter).toLocaleTimeString()}`);
        }
        throw new Error(data.error || 'Search failed');
      }

      setResults(data);
      
      // Update usage stats
      if (data.rateLimit) {
        setUsageStats({
          remaining: data.rateLimit.remaining,
          resetTime: data.rateLimit.resetTime
        });
      }
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Search was cancelled, ignore
      }
      
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query, searchType, context]);

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
    setTimeout(() => handleSearch(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredResults = results?.results.filter(result => 
    selectedCategory === 'all' || result.category === selectedCategory
  ) || [];

  const categoryTabs = results ? 
    Object.entries(results.categories).sort((a, b) => b[1] - a[1]) : 
    [];

  return (
    <div className={`space-y-6 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search with AI enhancement..."
              className="flex-1 pr-12"
              disabled={loading}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </Button>
        </div>

        {/* Search Options */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-400">Search type:</span>
          {(['quick', 'smart', 'deep'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`px-3 py-1 rounded-full transition-colors ${
                searchType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type === 'quick' && '⚡ Quick'}
              {type === 'smart' && '🎯 Smart'}
              {type === 'deep' && '🔬 Deep'}
            </button>
          ))}
          
          {usageStats && (
            <div className="ml-auto text-xs text-gray-400">
              {usageStats.remaining} searches remaining
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-400 text-sm bg-red-950 p-4 rounded-lg border border-red-800">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* AI Summary */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg border border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400">🤖</span>
                <h3 className="text-lg font-semibold text-white">AI Summary</h3>
                {results.cached && (
                  <span className="text-xs bg-green-800 text-green-200 px-2 py-1 rounded-full">
                    Cached
                  </span>
                )}
                {results.processingTime && (
                  <span className="text-xs text-gray-400">
                    {results.processingTime}ms
                  </span>
                )}
              </div>
              <p className="text-gray-200">{results.aiSummary}</p>
            </div>

            {/* Category Filters */}
            {categoryTabs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All ({results.results.length})
                </button>
                {categoryTabs.map(([category, count]) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors capitalize ${
                      selectedCategory === category
                        ? CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {category} ({count})
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Results ({filteredResults.length})
                </h3>
                {results.insights && (
                  <button
                    onClick={() => setShowInsights(!showInsights)}
                    className="text-sm text-gray-400 hover:text-gray-200"
                  >
                    {showInsights ? 'Hide' : 'Show'} Insights
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredResults.map((result, index) => (
                  <motion.div
                    key={result.url}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-all cursor-pointer group"
                    onClick={() => onResultSelect?.(result)}
                  >
                    <div className="flex items-start gap-3">
                      {result.thumbnail?.src && (
                        <img
                          src={result.thumbnail.src}
                          alt=""
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                            {result.title}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs border ${CATEGORY_COLORS[result.category]}`}>
                            {result.category}
                          </span>
                          {result.difficulty && (
                            <span className={`text-xs ${DIFFICULTY_COLORS[result.difficulty]}`}>
                              {result.difficulty}
                            </span>
                          )}
                        </div>
                        
                        {result.aiSummary && (
                          <p className="text-blue-300 text-xs mb-2 line-clamp-2 italic">
                            💡 {result.aiSummary}
                          </p>
                        )}
                        
                        <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                          {result.description}
                        </p>
                        
                        {result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {result.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                            {result.tags.length > 3 && (
                              <span className="text-gray-400 text-xs">
                                +{result.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="truncate">{result.url}</span>
                          {result.age && (
                            <span className="flex-shrink-0">• {result.age}</span>
                          )}
                          <span className="flex-shrink-0">
                            Score: {Math.round(result.relevanceScore)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Suggested Queries */}
            {results.suggestedQueries.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Suggested searches:</h4>
                <div className="flex flex-wrap gap-2">
                  {results.suggestedQueries.map((suggested) => (
                    <button
                      key={suggested}
                      onClick={() => handleSuggestedQuery(suggested)}
                      className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-full hover:bg-blue-700 hover:text-blue-200 transition-colors"
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {showInsights && results.insights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-600"
              >
                <h4 className="text-sm font-medium text-gray-300">🧠 AI Insights</h4>
                
                {results.insights.trendingTopics && results.insights.trendingTopics.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Trending topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.insights.trendingTopics.map(topic => (
                        <span key={topic} className="bg-orange-900/30 text-orange-300 px-2 py-1 rounded text-xs">
                          📈 {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {results.insights.recommendedActions && results.insights.recommendedActions.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Recommended next steps:</p>
                    <ul className="space-y-1">
                      {results.insights.recommendedActions.map((action, i) => (
                        <li key={i} className="text-xs text-green-300 flex items-start gap-2">
                          <span>💡</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}