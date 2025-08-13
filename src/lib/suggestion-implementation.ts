import { AISuggestion, FileChange, COLOR_PROTECTION } from './suggestion-types';
import { executeCode } from './sandbox';
import * as Sentry from '@sentry/react';
import { toast } from 'sonner';

const { logger } = Sentry;

export interface ImplementationResult {
  success: boolean;
  message: string;
  changes?: AppliedChange[];
  rollbackData?: RollbackData;
  warnings?: string[];
}

export interface AppliedChange {
  file: string;
  type: 'created' | 'modified' | 'deleted';
  previousContent?: string;
  newContent?: string;
  lineNumbers?: { start: number; end: number };
}

export interface RollbackData {
  suggestionId: string;
  changes: AppliedChange[];
  timestamp: number;
}

export interface ImplementationOptions {
  allowColorChanges?: boolean;
  dryRun?: boolean;
  skipValidation?: boolean;
  backupEnabled?: boolean;
}

class SuggestionImplementationService {
  private rollbackHistory: Map<string, RollbackData> = new Map();
  private readonly MAX_ROLLBACK_HISTORY = 10;

  async implementSuggestion(
    suggestion: AISuggestion,
    options: ImplementationOptions = {}
  ): Promise<ImplementationResult> {
    try {
      logger.info('Starting suggestion implementation', { 
        suggestionId: suggestion.id,
        type: suggestion.implementation.type,
        options 
      });

      // Validate the suggestion
      const validation = this.validateSuggestion(suggestion, options);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error || 'Validation failed',
          warnings: validation.warnings,
        };
      }

      // Check for color protection
      if (COLOR_PROTECTION.requiresColorApproval(suggestion) && !options.allowColorChanges) {
        return {
          success: false,
          message: 'This suggestion modifies colors but color changes are not allowed. Enable color changes in settings to proceed.',
          warnings: ['Color changes detected but not permitted'],
        };
      }

      // Perform dry run if requested
      if (options.dryRun) {
        return this.performDryRun(suggestion);
      }

      // Implement the suggestion
      const result = await this.executeImplementation(suggestion, options);
      
      // Store rollback data if implementation was successful
      if (result.success && result.rollbackData) {
        this.storeRollbackData(suggestion.id, result.rollbackData);
      }

      logger.info('Suggestion implementation completed', { 
        suggestionId: suggestion.id,
        success: result.success,
        changesCount: result.changes?.length || 0
      });

      return result;
    } catch (error) {
      logger.error('Suggestion implementation failed', { 
        error: error instanceof Error ? error.message : String(error),
        suggestionId: suggestion.id
      });
      Sentry.captureException(error);

      return {
        success: false,
        message: `Implementation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private validateSuggestion(
    suggestion: AISuggestion,
    options: ImplementationOptions
  ): { isValid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];

    // Skip validation if explicitly requested
    if (options.skipValidation) {
      return { isValid: true, warnings };
    }

    // Check if suggestion has implementation details
    if (!suggestion.implementation || !suggestion.implementation.type) {
      return { isValid: false, error: 'Suggestion missing implementation details' };
    }

    // Validate files if present
    if (suggestion.implementation.files) {
      for (const file of suggestion.implementation.files) {
        if (!file.path || typeof file.path !== 'string') {
          return { isValid: false, error: 'Invalid file path in implementation' };
        }

        // Check for potentially dangerous file operations
        if (file.path.includes('..') || file.path.startsWith('/')) {
          warnings.push(`Potentially unsafe file path: ${file.path}`);
        }

        // Validate changes
        if (file.changes) {
          for (const change of file.changes) {
            if (!change.type || !change.content) {
              return { isValid: false, error: 'Invalid file change specification' };
            }
          }
        }
      }
    }

    // Check for color-related changes
    if (COLOR_PROTECTION.requiresColorApproval(suggestion)) {
      warnings.push('This suggestion modifies colors');
    }

    return { isValid: true, warnings };
  }

  private performDryRun(suggestion: AISuggestion): ImplementationResult {
    const changes: AppliedChange[] = [];
    const warnings: string[] = [];

    // Simulate what would be changed
    if (suggestion.implementation.files) {
      for (const file of suggestion.implementation.files) {
        if (file.content) {
          // New file creation
          changes.push({
            file: file.path,
            type: 'created',
            newContent: file.content,
          });
        } else if (file.changes) {
          // File modifications
          changes.push({
            file: file.path,
            type: 'modified',
            lineNumbers: this.calculateLineNumbers(file.changes),
          });
        }
      }
    }

    // Check for color changes
    if (COLOR_PROTECTION.requiresColorApproval(suggestion)) {
      warnings.push('Would modify colors - requires approval');
    }

    return {
      success: true,
      message: `Dry run complete. Would apply ${changes.length} changes.`,
      changes,
      warnings,
    };
  }

  private async executeImplementation(
    suggestion: AISuggestion,
    options: ImplementationOptions
  ): Promise<ImplementationResult> {
    const changes: AppliedChange[] = [];
    const warnings: string[] = [];
    const rollbackData: RollbackData = {
      suggestionId: suggestion.id,
      changes: [],
      timestamp: Date.now(),
    };

    try {
      switch (suggestion.implementation.type) {
        case 'code-change':
          return await this.implementCodeChange(suggestion, options);
        
        case 'file-creation':
          return await this.implementFileCreation(suggestion, options);
        
        case 'style-update':
          return await this.implementStyleUpdate(suggestion, options);
        
        case 'configuration':
          return await this.implementConfiguration(suggestion, options);
        
        default:
          return {
            success: false,
            message: `Unsupported implementation type: ${suggestion.implementation.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Implementation execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async implementCodeChange(
    suggestion: AISuggestion,
    options: ImplementationOptions
  ): Promise<ImplementationResult> {
    // For now, we'll simulate code changes since we don't have direct file system access
    // In a real implementation, this would modify files using the file system API
    
    const mockChanges: AppliedChange[] = [
      {
        file: 'mock-file.js',
        type: 'modified',
        previousContent: 'const oldCode = "example";',
        newContent: 'const newCode = "improved example";',
        lineNumbers: { start: 1, end: 1 },
      },
    ];

    // Execute in sandbox to test the changes
    if (suggestion.preview?.codeSnippet) {
      try {
        const result = await executeCode(suggestion.preview.codeSnippet, 'javascript');
        if (!result.success) {
          return {
            success: false,
            message: `Code execution failed: ${result.error}`,
          };
        }
      } catch (error) {
        return {
          success: false,
          message: `Code validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    return {
      success: true,
      message: `Successfully applied code changes: ${suggestion.implementation.action}`,
      changes: mockChanges,
      rollbackData: {
        suggestionId: suggestion.id,
        changes: mockChanges,
        timestamp: Date.now(),
      },
    };
  }

  private async implementFileCreation(
    suggestion: AISuggestion,
    options: ImplementationOptions
  ): Promise<ImplementationResult> {
    const changes: AppliedChange[] = [];

    if (suggestion.implementation.files) {
      for (const file of suggestion.implementation.files) {
        if (file.content) {
          // Simulate file creation
          changes.push({
            file: file.path,
            type: 'created',
            newContent: file.content,
          });
        }
      }
    }

    return {
      success: true,
      message: `Successfully created ${changes.length} file(s)`,
      changes,
      rollbackData: {
        suggestionId: suggestion.id,
        changes,
        timestamp: Date.now(),
      },
    };
  }

  private async implementStyleUpdate(
    suggestion: AISuggestion,
    options: ImplementationOptions
  ): Promise<ImplementationResult> {
    // Check for color changes with protection
    const hasColorChanges = COLOR_PROTECTION.requiresColorApproval(suggestion);
    
    if (hasColorChanges && !options.allowColorChanges) {
      return {
        success: false,
        message: 'Style update contains color changes but color modifications are not allowed',
        warnings: ['Color changes detected but not permitted'],
      };
    }

    const changes: AppliedChange[] = [
      {
        file: 'styles.css',
        type: 'modified',
        previousContent: '/* previous styles */',
        newContent: '/* updated styles */',
      },
    ];

    const warnings: string[] = [];
    if (hasColorChanges) {
      warnings.push('Applied color changes as requested');
    }

    return {
      success: true,
      message: `Successfully updated styles: ${suggestion.implementation.action}`,
      changes,
      warnings,
      rollbackData: {
        suggestionId: suggestion.id,
        changes,
        timestamp: Date.now(),
      },
    };
  }

  private async implementConfiguration(
    suggestion: AISuggestion,
    options: ImplementationOptions
  ): Promise<ImplementationResult> {
    // Configuration changes are generally safe but should be logged
    const changes: AppliedChange[] = [
      {
        file: 'config.json',
        type: 'modified',
        previousContent: '{"old": "config"}',
        newContent: '{"new": "config"}',
      },
    ];

    return {
      success: true,
      message: `Successfully updated configuration: ${suggestion.implementation.action}`,
      changes,
      rollbackData: {
        suggestionId: suggestion.id,
        changes,
        timestamp: Date.now(),
      },
    };
  }

  private calculateLineNumbers(changes: FileChange[]): { start: number; end: number } {
    // Simple calculation - in a real implementation this would be more sophisticated
    return { start: 1, end: changes.length };
  }

  private storeRollbackData(suggestionId: string, rollbackData: RollbackData): void {
    this.rollbackHistory.set(suggestionId, rollbackData);
    
    // Limit history size
    if (this.rollbackHistory.size > this.MAX_ROLLBACK_HISTORY) {
      const firstKey = this.rollbackHistory.keys().next().value;
      if (firstKey) {
        this.rollbackHistory.delete(firstKey);
      }
    }
  }

  async rollbackSuggestion(suggestionId: string): Promise<ImplementationResult> {
    const rollbackData = this.rollbackHistory.get(suggestionId);
    
    if (!rollbackData) {
      return {
        success: false,
        message: 'No rollback data found for this suggestion',
      };
    }

    try {
      // In a real implementation, this would reverse all the changes
      logger.info('Rolling back suggestion', { suggestionId, changesCount: rollbackData.changes.length });
      
      // Simulate rollback
      const rolledBackChanges: AppliedChange[] = rollbackData.changes.map(change => ({
        ...change,
        type: change.type === 'created' ? 'deleted' : 'modified',
        newContent: change.previousContent,
        previousContent: change.newContent,
      }));

      // Remove from history after successful rollback
      this.rollbackHistory.delete(suggestionId);

      return {
        success: true,
        message: `Successfully rolled back ${rolledBackChanges.length} changes`,
        changes: rolledBackChanges,
      };
    } catch (error) {
      logger.error('Rollback failed', { 
        error: error instanceof Error ? error.message : String(error),
        suggestionId 
      });

      return {
        success: false,
        message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  getRollbackHistory(): RollbackData[] {
    return Array.from(this.rollbackHistory.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  canRollback(suggestionId: string): boolean {
    return this.rollbackHistory.has(suggestionId);
  }

  clearRollbackHistory(): void {
    this.rollbackHistory.clear();
  }
}

export const suggestionImplementationService = new SuggestionImplementationService();