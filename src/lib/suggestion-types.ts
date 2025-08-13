export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  estimatedTime: string; // e.g., "2 min", "5 min"
  difficulty: SuggestionDifficulty;
  implementation: SuggestionImplementation;
  preview?: {
    before?: string;
    after?: string;
    codeSnippet?: string;
  };
  metadata?: {
    frameworks?: string[];
    touchesColors?: boolean; // Flag for color protection
    requiresUserApproval?: boolean;
    reversible?: boolean;
  };
  createdAt: number;
}

export type SuggestionCategory = 
  | 'ui-improvement'
  | 'performance'
  | 'accessibility'
  | 'security'
  | 'feature-addition'
  | 'code-quality'
  | 'responsiveness'
  | 'seo'
  | 'modernization';

export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical';

export type SuggestionDifficulty = 'easy' | 'medium' | 'hard';

export interface SuggestionImplementation {
  type: 'code-change' | 'file-creation' | 'style-update' | 'configuration';
  action: string; // Human-readable action description
  files?: {
    path: string;
    content?: string;
    changes?: FileChange[];
  }[];
  dependencies?: string[];
  warnings?: string[];
}

export interface FileChange {
  type: 'replace' | 'insert' | 'delete' | 'append';
  target: string; // Line number, selector, or pattern to match
  content: string;
  backup?: string; // For rollback
}

export interface SuggestionContext {
  currentUrl?: string;
  websiteAnalysis?: {
    title?: string;
    technologies?: string[];
    layout?: string;
    colorScheme?: string[];
    components?: string[];
  };
  chatHistory?: {
    recentMessages: string[];
    currentIntent?: string;
  };
  userPreferences?: {
    allowColorChanges: boolean;
    preferredFramework?: string;
    developmentStage?: 'prototype' | 'development' | 'production';
  };
  codeContext?: {
    language?: string;
    framework?: string;
    recentCode?: string;
  };
}

export interface SuggestionFilter {
  categories?: SuggestionCategory[];
  priority?: SuggestionPriority[];
  difficulty?: SuggestionDifficulty[];
  touchesColors?: boolean;
  requiresUserApproval?: boolean;
}

export interface SuggestionResult {
  suggestions: AISuggestion[];
  context: SuggestionContext;
  generatedAt: number;
  totalCount: number;
}

// Predefined suggestion templates for common scenarios
export const SUGGESTION_TEMPLATES = {
  RESPONSIVE_DESIGN: {
    category: 'responsiveness' as SuggestionCategory,
    title: 'Improve Mobile Responsiveness',
    priority: 'high' as SuggestionPriority,
    difficulty: 'medium' as SuggestionDifficulty,
  },
  ACCESSIBILITY_ARIA: {
    category: 'accessibility' as SuggestionCategory,
    title: 'Add ARIA Labels',
    priority: 'medium' as SuggestionPriority,
    difficulty: 'easy' as SuggestionDifficulty,
  },
  PERFORMANCE_OPTIMIZATION: {
    category: 'performance' as SuggestionCategory,
    title: 'Optimize Performance',
    priority: 'high' as SuggestionPriority,
    difficulty: 'medium' as SuggestionDifficulty,
  },
  COLOR_SCHEME_UPDATE: {
    category: 'ui-improvement' as SuggestionCategory,
    title: 'Update Color Scheme',
    priority: 'low' as SuggestionPriority,
    difficulty: 'easy' as SuggestionDifficulty,
    metadata: {
      touchesColors: true,
      requiresUserApproval: true,
    },
  },
} as const;

// Color protection utilities
export const COLOR_PROTECTION = {
  isColorRelated: (content: string): boolean => {
    const colorPatterns = [
      /color\s*[:=]/i,
      /background\s*[:=]/i,
      /#[0-9a-f]{3,6}/i,
      /rgb\(/i,
      /rgba\(/i,
      /hsl\(/i,
      /hsla\(/i,
      /\.(bg-|text-|border-)/i, // Tailwind color classes
    ];
    return colorPatterns.some(pattern => pattern.test(content));
  },
  
  requiresColorApproval: (suggestion: AISuggestion): boolean => {
    if (suggestion.metadata?.touchesColors) return true;
    
    const hasColorChanges = suggestion.implementation.files?.some(file => {
      if (file.content && COLOR_PROTECTION.isColorRelated(file.content)) return true;
      return file.changes?.some(change => COLOR_PROTECTION.isColorRelated(change.content));
    });
    
    return hasColorChanges || false;
  },
};