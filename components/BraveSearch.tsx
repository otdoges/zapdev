'use client';

/**
 * DEPRECATED: BraveSearch Component
 * 
 * This component has been replaced with UserSearch for better user experience.
 * It now shows a deprecation notice and redirects users to the new search system.
 * 
 * The internal search functionality has been moved to lib/search/internal-brave-search.ts
 * for AI-only usage.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  thumbnail?: {
    src: string;
  };
}

interface BraveSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  compact?: boolean;
}

export default function BraveSearch({ onResultSelect, compact = false }: BraveSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeprecationNotice, setShowDeprecationNotice] = useState(true);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/brave-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: query.trim(),
          count: compact ? 5 : 10
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`space-y-4 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Deprecation Notice */}
      {showDeprecationNotice && (
        <div className="bg-orange-950 border border-orange-700 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-orange-400 text-lg">⚠️</span>
            <div className="flex-1">
              <h3 className="text-orange-300 font-semibold mb-2">
                Search System Upgraded!
              </h3>
              <p className="text-orange-200 text-sm mb-3">
                This search interface has been replaced with an AI-enhanced search system 
                that provides better categorization, relevance scoring, and insights.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeprecationNotice(false)}
                  className="text-xs bg-orange-800 hover:bg-orange-700 text-orange-200 px-3 py-1 rounded transition-colors"
                >
                  Continue with legacy search
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs bg-blue-800 hover:bg-blue-700 text-blue-200 px-3 py-1 rounded transition-colors"
                >
                  Switch to new search
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search the web with Brave..."
          className="flex-1"
          disabled={loading}
        />
        <Button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? '🔍...' : '🔍 Search'}
        </Button>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-800">
          ⚠️ {error}
        </div>
      )}

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold text-white">
              Search Results ({results.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
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
                      <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">
                        {result.title}
                      </h4>
                      <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                        {result.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="truncate">{result.url}</span>
                        {result.age && (
                          <span className="flex-shrink-0">• {result.age}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}