import { generateAIResponse } from './ai';
import { createTokenBucketRateLimiter } from './rate-limiter';
import { withTimeout } from './ai-utils';
import * as Sentry from '@sentry/react';
import {
  AISuggestion,
  SuggestionContext,
  SuggestionResult,
  SuggestionFilter,
  SUGGESTION_TEMPLATES,
  COLOR_PROTECTION,
} from './suggestion-types';

const { logger } = Sentry;

// Rate limiting for suggestions (less aggressive than search)
const SUGGESTIONS_BURST = 5;
const SUGGESTIONS_REFILL_MS = 60_000; // 1 minute
const enforceSuggestionsRateLimit = createTokenBucketRateLimiter(
  SUGGESTIONS_BURST,
  SUGGESTIONS_REFILL_MS,
  'Too many suggestion requests. Please wait a moment.'
);

// Cache for suggestions to avoid regenerating identical requests
const suggestionsCache = new Map<string, { result: SuggestionResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class AISuggestionsService {
  private generateCacheKey(context: SuggestionContext, filter?: SuggestionFilter): string {
    return JSON.stringify({ context, filter });
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of suggestionsCache.entries()) {
      if (!this.isCacheValid(value.timestamp)) {
        suggestionsCache.delete(key);
      }
    }
  }

  async generateSuggestions(
    context: SuggestionContext,
    filter?: SuggestionFilter
  ): Promise<SuggestionResult> {
    enforceSuggestionsRateLimit();
    this.cleanCache();

    const cacheKey = this.generateCacheKey(context, filter);
    const cached = suggestionsCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      logger.info('Using cached AI suggestions');
      return cached.result;
    }

    try {
      logger.info('Generating AI suggestions', { 
        contextKeys: Object.keys(context),
        hasFilter: !!filter 
      });

      const prompt = this.buildSuggestionPrompt(context, filter);
      const aiResponse = await withTimeout(
        generateAIResponse(prompt, { skipCache: true }),
        30_000
      );

      const suggestions = this.parseAISuggestions(aiResponse, context);
      const result: SuggestionResult = {
        suggestions: this.filterSuggestions(suggestions, filter),
        context,
        generatedAt: Date.now(),
        totalCount: suggestions.length,
      };

      // Cache the result
      suggestionsCache.set(cacheKey, { result, timestamp: Date.now() });

      logger.info('AI suggestions generated successfully', { 
        suggestionCount: result.suggestions.length,
        totalGenerated: result.totalCount
      });

      return result;
    } catch (error) {
      logger.error('Failed to generate AI suggestions', { 
        error: error instanceof Error ? error.message : String(error),
        context
      });
      Sentry.captureException(error);
      
      // Return fallback suggestions on error
      return this.getFallbackSuggestions(context);
    }
  }

  private buildSuggestionPrompt(context: SuggestionContext, filter?: SuggestionFilter): string {
    let prompt = `You are an expert web development assistant. Analyze the provided context and generate specific, actionable improvement suggestions.

CONTEXT ANALYSIS:`;

    if (context.websiteAnalysis) {
      prompt += `
Website Details:
- Title: ${context.websiteAnalysis.title || 'Unknown'}
- Technologies: ${context.websiteAnalysis.technologies?.join(', ') || 'Unknown'}
- Layout: ${context.websiteAnalysis.layout || 'Unknown'}
- Components: ${context.websiteAnalysis.components?.join(', ') || 'None detected'}`;
    }

    if (context.chatHistory?.recentMessages.length) {
      prompt += `
Recent Conversation Context:
${context.chatHistory.recentMessages.slice(-3).join('\n')}`;
    }

    if (context.codeContext?.recentCode) {
      prompt += `
Recent Code Context:
\`\`\`${context.codeContext.language || 'javascript'}
${context.codeContext.recentCode}
\`\`\``;
    }

    prompt += `

USER PREFERENCES:
- Allow Color Changes: ${context.userPreferences?.allowColorChanges ?? false}
- Preferred Framework: ${context.userPreferences?.preferredFramework || 'Any'}
- Development Stage: ${context.userPreferences?.developmentStage || 'development'}`;

    if (filter) {
      prompt += `
FILTER REQUIREMENTS:
- Categories: ${filter.categories?.join(', ') || 'All'}
- Priority Levels: ${filter.priority?.join(', ') || 'All'}
- Difficulty: ${filter.difficulty?.join(', ') || 'All'}`;
    }

    prompt += `

Generate 3-5 specific suggestions in this EXACT JSON format:
[
  {
    "title": "Clear, action-oriented title",
    "description": "Detailed explanation of the improvement and its benefits",
    "category": "ui-improvement|performance|accessibility|security|feature-addition|code-quality|responsiveness|seo|modernization",
    "priority": "low|medium|high|critical",
    "estimatedTime": "1 min|5 min|15 min|30 min|1 hour",
    "difficulty": "easy|medium|hard",
    "implementation": {
      "type": "code-change|file-creation|style-update|configuration",
      "action": "Human-readable description of what will be changed",
      "files": [
        {
          "path": "relative/path/to/file.ext",
          "content": "New file content or null for existing files",
          "changes": [
            {
              "type": "replace|insert|delete|append",
              "target": "Line number or pattern to match",
              "content": "New content to insert/replace"
            }
          ]
        }
      ]
    },
    "preview": {
      "codeSnippet": "Brief example of the change"
    },
    "metadata": {
      "touchesColors": false,
      "requiresUserApproval": false,
      "reversible": true
    }
  }
]

IMPORTANT RULES:
1. ${context.userPreferences?.allowColorChanges ? 'Color changes are allowed' : 'NEVER suggest color changes unless explicitly requested - set touchesColors: true and requiresUserApproval: true for any color-related changes'}
2. Focus on practical, immediately actionable improvements
3. Consider the current technology stack
4. Prioritize suggestions based on development stage
5. Ensure all suggestions are safe and reversible
6. Return only valid JSON, no extra text`;

    return prompt;
  }

  private parseAISuggestions(aiResponse: string, context: SuggestionContext): AISuggestion[] {
    try {
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const suggestionsData = JSON.parse(jsonMatch[0]);
      
      return suggestionsData.map((suggestion: any, index: number): AISuggestion => {
        // Apply color protection
        const touchesColors = COLOR_PROTECTION.isColorRelated(JSON.stringify(suggestion.implementation));
        
        return {
          id: `ai-suggestion-${Date.now()}-${index}`,
          title: suggestion.title || 'Untitled Suggestion',
          description: suggestion.description || 'No description provided',
          category: suggestion.category || 'ui-improvement',
          priority: suggestion.priority || 'medium',
          estimatedTime: suggestion.estimatedTime || '5 min',
          difficulty: suggestion.difficulty || 'medium',
          implementation: suggestion.implementation || {
            type: 'code-change',
            action: 'Manual implementation required',
            files: []
          },
          preview: suggestion.preview,
          metadata: {
            ...suggestion.metadata,
            touchesColors: touchesColors || suggestion.metadata?.touchesColors || false,
            requiresUserApproval: touchesColors || suggestion.metadata?.requiresUserApproval || false,
            reversible: suggestion.metadata?.reversible ?? true,
          },
          createdAt: Date.now(),
        };
      });
    } catch (error) {
      logger.error('Failed to parse AI suggestions', { error: error instanceof Error ? error.message : String(error) });
      return this.getTemplateSuggestions(context);
    }
  }

  private filterSuggestions(suggestions: AISuggestion[], filter?: SuggestionFilter): AISuggestion[] {
    if (!filter) return suggestions;

    return suggestions.filter(suggestion => {
      if (filter.categories && !filter.categories.includes(suggestion.category)) {
        return false;
      }
      if (filter.priority && !filter.priority.includes(suggestion.priority)) {
        return false;
      }
      if (filter.difficulty && !filter.difficulty.includes(suggestion.difficulty)) {
        return false;
      }
      if (filter.touchesColors !== undefined && suggestion.metadata?.touchesColors !== filter.touchesColors) {
        return false;
      }
      if (filter.requiresUserApproval !== undefined && suggestion.metadata?.requiresUserApproval !== filter.requiresUserApproval) {
        return false;
      }
      return true;
    });
  }

  private getTemplateSuggestions(context: SuggestionContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // Add responsive design suggestion if mobile improvements might be needed
    suggestions.push({
      id: `template-responsive-${Date.now()}`,
      ...SUGGESTION_TEMPLATES.RESPONSIVE_DESIGN,
      description: 'Improve mobile responsiveness with better breakpoints and flexible layouts',
      estimatedTime: '15 min',
      implementation: {
        type: 'style-update',
        action: 'Add responsive CSS classes and breakpoints',
        files: []
      },
      createdAt: Date.now(),
    });

    // Add accessibility suggestion
    suggestions.push({
      id: `template-accessibility-${Date.now()}`,
      ...SUGGESTION_TEMPLATES.ACCESSIBILITY_ARIA,
      description: 'Improve accessibility by adding ARIA labels and semantic HTML elements',
      estimatedTime: '10 min',
      implementation: {
        type: 'code-change',
        action: 'Add ARIA labels and improve semantic markup',
        files: []
      },
      createdAt: Date.now(),
    });

    // Only add color suggestion if allowed
    if (context.userPreferences?.allowColorChanges) {
      suggestions.push({
        id: `template-colors-${Date.now()}`,
        ...SUGGESTION_TEMPLATES.COLOR_SCHEME_UPDATE,
        description: 'Update color scheme for better contrast and modern appearance',
        estimatedTime: '20 min',
        implementation: {
          type: 'style-update',
          action: 'Update color variables and theme',
          files: []
        },
        metadata: {
          touchesColors: true,
          requiresUserApproval: true,
          reversible: true,
        },
        createdAt: Date.now(),
      });
    }

    return suggestions;
  }

  private getFallbackSuggestions(context: SuggestionContext): SuggestionResult {
    return {
      suggestions: this.getTemplateSuggestions(context),
      context,
      generatedAt: Date.now(),
      totalCount: 3,
    };
  }

  // Method to validate suggestions before implementation
  validateSuggestion(suggestion: AISuggestion, userPreferences?: SuggestionContext['userPreferences']): {
    isValid: boolean;
    warnings: string[];
    requiresApproval: boolean;
  } {
    const warnings: string[] = [];
    let requiresApproval = suggestion.metadata?.requiresUserApproval || false;

    // Check color protection
    if (COLOR_PROTECTION.requiresColorApproval(suggestion)) {
      if (!userPreferences?.allowColorChanges) {
        warnings.push('This suggestion involves color changes. Please enable color changes in preferences or review manually.');
        requiresApproval = true;
      }
    }

    // Check file operations
    const hasFileOperations = suggestion.implementation.files && suggestion.implementation.files.length > 0;
    if (hasFileOperations) {
      warnings.push('This suggestion will modify files. Review changes before applying.');
      requiresApproval = true;
    }

    // Check dependencies
    if (suggestion.implementation.dependencies?.length) {
      warnings.push(`This suggestion requires dependencies: ${suggestion.implementation.dependencies.join(', ')}`);
    }

    return {
      isValid: warnings.length === 0 || userPreferences?.allowColorChanges === true,
      warnings,
      requiresApproval,
    };
  }
}

export const aiSuggestionsService = new AISuggestionsService();