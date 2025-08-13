import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  X,
  Filter,
  RefreshCw,
  Search,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { aiSuggestionsService } from '@/lib/ai-suggestions';
import { websiteStateAnalyzer } from '@/lib/website-state-analyzer';
import { 
  AISuggestion, 
  SuggestionCategory, 
  SuggestionFilter, 
  SuggestionResult,
  SuggestionContext 
} from '@/lib/suggestion-types';
import SuggestionCard from './SuggestionCard';
import { toast } from 'sonner';

interface AISuggestionsProps {
  isVisible: boolean;
  onClose: () => void;
  context?: Partial<SuggestionContext>;
  onImplementSuggestion?: (suggestion: AISuggestion) => Promise<any>;
  className?: string;
}

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  'ui-improvement': 'UI/UX',
  'performance': 'Performance',
  'accessibility': 'Accessibility',
  'security': 'Security',
  'feature-addition': 'Features',
  'code-quality': 'Code Quality',
  'responsiveness': 'Responsive',
  'seo': 'SEO',
  'modernization': 'Modernization',
};

const AISuggestions: React.FC<AISuggestionsProps> = ({
  isVisible,
  onClose,
  context,
  onImplementSuggestion,
  className = '',
}) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SuggestionCategory | 'all'>('all');
  const [implementingIds, setImplementingIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<SuggestionFilter>({});
  const [lastGenerated, setLastGenerated] = useState<number>(0);
  const [userPreferences, setUserPreferences] = useState({
    allowColorChanges: false,
    preferredFramework: 'React',
    developmentStage: 'development' as const,
  });

  // Generate suggestions when context changes or component mounts
  const generateSuggestions = useCallback(async () => {
    if (!user || !isVisible) return;

    setIsLoading(true);
    try {
      const suggestionContext = websiteStateAnalyzer.buildSuggestionContext(
        undefined, // websiteAnalysis - would be populated from props
        context?.chatHistory?.recentMessages,
        context?.codeContext,
        userPreferences
      );

      const result = await aiSuggestionsService.generateSuggestions(suggestionContext, filter);
      setSuggestions(result.suggestions);
      setLastGenerated(result.generatedAt);
      
      toast.success(`Generated ${result.suggestions.length} suggestions`);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast.error('Failed to generate suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, isVisible, context, filter, userPreferences]);

  // Filter suggestions based on search and category
  useEffect(() => {
    let filtered = suggestions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        suggestion =>
          suggestion.title.toLowerCase().includes(query) ||
          suggestion.description.toLowerCase().includes(query) ||
          suggestion.category.includes(query)
      );
    }

    // Apply category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(suggestion => suggestion.category === activeCategory);
    }

    setFilteredSuggestions(filtered);
  }, [suggestions, searchQuery, activeCategory]);

  // Generate suggestions on mount and context changes
  useEffect(() => {
    if (isVisible && suggestions.length === 0) {
      generateSuggestions();
    }
  }, [isVisible, generateSuggestions, suggestions.length]);

  const handleImplementSuggestion = async (suggestion: AISuggestion) => {
    if (implementingIds.has(suggestion.id)) return;

    // Validate suggestion before implementing
    const validation = aiSuggestionsService.validateSuggestion(suggestion, userPreferences);
    
    if (!validation.isValid) {
      toast.error(`Cannot implement suggestion: ${validation.warnings.join(', ')}`);
      return;
    }

    if (validation.requiresApproval && !userPreferences.allowColorChanges && suggestion.metadata?.touchesColors) {
      toast.warning('This suggestion involves color changes. Please enable color changes in settings first.');
      return;
    }

    setImplementingIds(prev => new Set(prev).add(suggestion.id));

    try {
      if (onImplementSuggestion) {
        await onImplementSuggestion(suggestion);
      } else {
        // Default implementation - just show what would be done
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success(`Would implement: ${suggestion.implementation.action}`);
      }

      // Remove implemented suggestion from list
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      toast.error(`Implementation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImplementingIds(prev => {
        const updated = new Set(prev);
        updated.delete(suggestion.id);
        return updated;
      });
    }
  };

  const handleRefresh = () => {
    setSuggestions([]);
    generateSuggestions();
  };

  const getCategoryCounts = () => {
    const counts: Record<string, number> = { all: suggestions.length };
    suggestions.forEach(suggestion => {
      counts[suggestion.category] = (counts[suggestion.category] || 0) + 1;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: isCollapsed ? 'calc(100% - 48px)' : 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed right-0 top-0 h-full bg-[#0A0A0A] border-l border-gray-800/60 shadow-2xl z-50 ${
        isCollapsed ? 'w-12' : 'w-96'
      } ${className}`}
    >
      {/* Collapsed state */}
      {isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full flex flex-col items-center justify-center"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="mt-4 -rotate-90 text-xs text-gray-500 whitespace-nowrap">
            AI Suggestions
          </div>
        </motion.div>
      )}

      {/* Expanded state */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-800/60 bg-[#1A1A1A]/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-100">AI Suggestions</h2>
                {suggestions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filteredSuggestions.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="w-8 h-8 p-0 text-gray-400 hover:text-gray-300"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(true)}
                  className="w-8 h-8 p-0 text-gray-400 hover:text-gray-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-8 h-8 p-0 text-gray-400 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8 text-sm bg-gray-800/50 border-gray-700"
              />
            </div>

            {/* Last updated */}
            {lastGenerated > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Updated {new Date(lastGenerated).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="px-4 py-2 border-b border-gray-800/60">
            <div className="grid w-full grid-cols-3 gap-1">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('all')}
                className="h-7 text-xs"
              >
                All ({categoryCounts.all || 0})
              </Button>
              <Button
                variant={activeCategory === 'ui-improvement' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('ui-improvement')}
                className="h-7 text-xs"
              >
                UI ({categoryCounts['ui-improvement'] || 0})
              </Button>
              <Button
                variant={activeCategory === 'performance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('performance')}
                className="h-7 text-xs"
              >
                Perf ({categoryCounts['performance'] || 0})
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Generating suggestions...</p>
                </div>
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <Lightbulb className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-2">
                    {suggestions.length === 0 ? 'No suggestions yet' : 'No matching suggestions'}
                  </p>
                  {suggestions.length === 0 && (
                    <Button
                      size="sm"
                      onClick={generateSuggestions}
                      className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Generate Ideas
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  <AnimatePresence>
                    {filteredSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <SuggestionCard
                          suggestion={suggestion}
                          onImplement={handleImplementSuggestion}
                          isImplementing={implementingIds.has(suggestion.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Settings Footer */}
          <div className="p-4 border-t border-gray-800/60 bg-[#1A1A1A]/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserPreferences(prev => ({
                  ...prev,
                  allowColorChanges: !prev.allowColorChanges
                }));
                toast.info(`Color changes ${!userPreferences.allowColorChanges ? 'enabled' : 'disabled'}`);
              }}
              className="w-full h-8 text-xs bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
            >
              <Settings className="w-3 h-3 mr-1" />
              {userPreferences.allowColorChanges ? 'Disable' : 'Enable'} Color Changes
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AISuggestions;