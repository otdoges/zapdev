import { useState, useCallback, useEffect } from 'react';
import { aiSuggestionsService } from '@/lib/ai-suggestions';
import { suggestionImplementationService } from '@/lib/suggestion-implementation';
import { websiteStateAnalyzer } from '@/lib/website-state-analyzer';
import { 
  AISuggestion, 
  SuggestionContext, 
  SuggestionFilter, 
  SuggestionResult 
} from '@/lib/suggestion-types';
import { ImplementationResult } from '@/lib/suggestion-implementation';
import { toast } from 'sonner';

export interface UseAISuggestionsOptions {
  autoGenerate?: boolean;
  context?: Partial<SuggestionContext>;
  filter?: SuggestionFilter;
  allowColorChanges?: boolean;
}

export interface UseAISuggestionsReturn {
  suggestions: AISuggestion[];
  isLoading: boolean;
  error: string | null;
  generateSuggestions: () => Promise<void>;
  implementSuggestion: (suggestion: AISuggestion) => Promise<ImplementationResult>;
  rollbackSuggestion: (suggestionId: string) => Promise<ImplementationResult>;
  clearSuggestions: () => void;
  canRollback: (suggestionId: string) => boolean;
  lastGenerated: number;
  totalCount: number;
}

export const useAISuggestions = (options: UseAISuggestionsOptions = {}): UseAISuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const generateSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build context from provided options
      const context = websiteStateAnalyzer.buildSuggestionContext(
        undefined, // websiteAnalysis - would come from props
        options.context?.chatHistory?.recentMessages,
        options.context?.codeContext,
        {
          allowColorChanges: options.allowColorChanges ?? false,
          preferredFramework: options.context?.userPreferences?.preferredFramework,
          developmentStage: options.context?.userPreferences?.developmentStage,
        }
      );

      const result = await aiSuggestionsService.generateSuggestions(context, options.filter);
      
      setSuggestions(result.suggestions);
      setLastGenerated(result.generatedAt);
      setTotalCount(result.totalCount);
      
      toast.success(`Generated ${result.suggestions.length} suggestions`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options.context, options.filter, options.allowColorChanges]);

  const implementSuggestion = useCallback(async (suggestion: AISuggestion): Promise<ImplementationResult> => {
    try {
      const result = await suggestionImplementationService.implementSuggestion(suggestion, {
        allowColorChanges: options.allowColorChanges ?? false,
        backupEnabled: true,
      });

      if (result.success) {
        // Remove implemented suggestion from the list
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Implementation failed';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }, [options.allowColorChanges]);

  const rollbackSuggestion = useCallback(async (suggestionId: string): Promise<ImplementationResult> => {
    try {
      const result = await suggestionImplementationService.rollbackSuggestion(suggestionId);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Rollback failed';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setLastGenerated(0);
    setTotalCount(0);
  }, []);

  const canRollback = useCallback((suggestionId: string): boolean => {
    return suggestionImplementationService.canRollback(suggestionId);
  }, []);

  // Auto-generate suggestions when options change (if enabled)
  useEffect(() => {
    if (options.autoGenerate && suggestions.length === 0) {
      generateSuggestions();
    }
  }, [options.autoGenerate, suggestions.length, generateSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    generateSuggestions,
    implementSuggestion,
    rollbackSuggestion,
    clearSuggestions,
    canRollback,
    lastGenerated,
    totalCount,
  };
};

// Hook for managing suggestion context
export const useSuggestionContext = () => {
  const [context, setContext] = useState<Partial<SuggestionContext>>({});

  const updateChatHistory = useCallback((messages: string[]) => {
    setContext(prev => ({
      ...prev,
      chatHistory: {
        recentMessages: messages.slice(-5), // Keep last 5 messages
        currentIntent: messages.length > 0 ? 'chat' : undefined,
      },
    }));
  }, []);

  const updateCodeContext = useCallback((code: string, language: string) => {
    const analysis = websiteStateAnalyzer.analyzeCode(code, language);
    setContext(prev => ({
      ...prev,
      codeContext: {
        language,
        framework: analysis.framework,
        recentCode: code,
      },
    }));
  }, []);

  const updateWebsiteAnalysis = useCallback((analysis: any) => {
    setContext(prev => ({
      ...prev,
      websiteAnalysis: {
        title: analysis.title,
        technologies: analysis.technologies,
        layout: analysis.layout,
        colorScheme: analysis.colorScheme,
        components: analysis.components,
      },
    }));
  }, []);

  const updateUserPreferences = useCallback((preferences: {
    allowColorChanges?: boolean;
    preferredFramework?: string;
    developmentStage?: 'prototype' | 'development' | 'production';
  }) => {
    setContext(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        ...preferences,
      },
    }));
  }, []);

  const clearContext = useCallback(() => {
    setContext({});
  }, []);

  return {
    context,
    updateChatHistory,
    updateCodeContext,
    updateWebsiteAnalysis,
    updateUserPreferences,
    clearContext,
  };
};