/**
 * Enhanced debug logging utility for tracking state changes and message processing issues
 */

interface StateSnapshot {
  timestamp: number;
  route: string;
  sandboxState: {
    exists: boolean;
    fileCacheSize: number;
    lastSync: number | null;
    sandboxId: string | null;
  };
  conversationState: {
    exists: boolean;
    messageCount: number;
    editCount: number;
    lastUpdated: number | null;
  };
  existingFiles: {
    exists: boolean;
    size: number;
  };
  activeSandbox: {
    exists: boolean;
  };
}

class DebugLogger {
  private stateHistory: StateSnapshot[] = [];
  private maxHistorySize = 50;

  /**
   * Capture current global state snapshot
   */
  captureStateSnapshot(route: string): StateSnapshot {
    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      route,
      sandboxState: {
        exists: !!global.sandboxState,
        fileCacheSize: global.sandboxState?.fileCache?.files 
          ? Object.keys(global.sandboxState.fileCache.files).length 
          : 0,
        lastSync: global.sandboxState?.fileCache?.lastSync || null,
        sandboxId: global.sandboxState?.fileCache?.sandboxId || null
      },
      conversationState: {
        exists: !!global.conversationState,
        messageCount: global.conversationState?.context?.messages?.length || 0,
        editCount: global.conversationState?.context?.edits?.length || 0,
        lastUpdated: global.conversationState?.lastUpdated || null
      },
      existingFiles: {
        exists: !!global.existingFiles,
        size: global.existingFiles?.size || 0
      },
      activeSandbox: {
        exists: !!global.activeSandbox
      }
    };

    // Add to history
    this.stateHistory.push(snapshot);
    
    // Keep history size manageable
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }

    return snapshot;
  }

  /**
   * Log state change with comparison to previous state
   */
  logStateChange(route: string, action: string, details?: any): void {
    const currentSnapshot = this.captureStateSnapshot(route);
    const previousSnapshot = this.stateHistory.length > 1 
      ? this.stateHistory[this.stateHistory.length - 2] 
      : null;

    console.log(`[${route}] STATE CHANGE: ${action}`);
    console.log(`[${route}] Current state:`, currentSnapshot);
    
    if (previousSnapshot) {
      const changes = this.detectChanges(previousSnapshot, currentSnapshot);
      if (changes.length > 0) {
        console.log(`[${route}] Detected changes:`, changes);
      } else {
        console.log(`[${route}] No state changes detected`);
      }
    }

    if (details) {
      console.log(`[${route}] Action details:`, details);
    }
  }

  /**
   * Detect changes between two state snapshots
   */
  private detectChanges(previous: StateSnapshot, current: StateSnapshot): string[] {
    const changes: string[] = [];

    if (previous.sandboxState.fileCacheSize !== current.sandboxState.fileCacheSize) {
      changes.push(`File cache size: ${previous.sandboxState.fileCacheSize} → ${current.sandboxState.fileCacheSize}`);
    }

    if (previous.conversationState.messageCount !== current.conversationState.messageCount) {
      changes.push(`Message count: ${previous.conversationState.messageCount} → ${current.conversationState.messageCount}`);
    }

    if (previous.conversationState.editCount !== current.conversationState.editCount) {
      changes.push(`Edit count: ${previous.conversationState.editCount} → ${current.conversationState.editCount}`);
    }

    if (previous.existingFiles.size !== current.existingFiles.size) {
      changes.push(`Existing files: ${previous.existingFiles.size} → ${current.existingFiles.size}`);
    }

    if (previous.activeSandbox.exists !== current.activeSandbox.exists) {
      changes.push(`Active sandbox: ${previous.activeSandbox.exists} → ${current.activeSandbox.exists}`);
    }

    return changes;
  }

  /**
   * Log state validation results
   */
  logStateValidation(route: string, validation: Record<string, any>): void {
    console.log(`[${route}] STATE VALIDATION:`, validation);
    
    const issues = Object.entries(validation).filter(([key, value]) => {
      // Detect potential issues
      if (key.includes('Exists') && value === false) return true;
      if (key.includes('Size') && value === 0) return true;
      if (key.includes('Count') && value === 0) return true;
      return false;
    });

    if (issues.length > 0) {
      console.warn(`[${route}] POTENTIAL ISSUES:`, issues.map(([key, value]) => `${key}: ${value}`));
    }
  }

  /**
   * Log request-response cycle summary
   */
  logRequestCycle(route: string, requestData: any, success: boolean, duration: number): void {
    console.log(`[${route}] REQUEST CYCLE SUMMARY:`);
    console.log(`[${route}] - Duration: ${duration}ms`);
    console.log(`[${route}] - Success: ${success}`);
    console.log(`[${route}] - Request data:`, {
      prompt: requestData.prompt?.substring(0, 100) + '...',
      isEdit: requestData.isEdit,
      hasContext: !!requestData.context,
      sandboxId: requestData.context?.sandboxId
    });
  }

  /**
   * Get state history for debugging
   */
  getStateHistory(): StateSnapshot[] {
    return [...this.stateHistory];
  }

  /**
   * Reset state history
   */
  resetHistory(): void {
    this.stateHistory = [];
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger();

// Export utility functions for common logging patterns
export const logStateChange = (route: string, action: string, details?: any) => 
  debugLogger.logStateChange(route, action, details);

export const logStateValidation = (route: string, validation: Record<string, any>) =>
  debugLogger.logStateValidation(route, validation);

export const logRequestCycle = (route: string, requestData: any, success: boolean, duration: number) =>
  debugLogger.logRequestCycle(route, requestData, success, duration);