import { errorLogger, ErrorCategory } from '@/lib/error-logger';

// Dynamic import for WebContainer to handle environments where it's not available
let WebContainer: any = null;
if (typeof window !== 'undefined') {
  try {
    WebContainer = require('@webcontainer/api').WebContainer;
  } catch (error) {
    console.warn('WebContainer API not available');
  }
}

export interface WebContainerManagerConfig {
  initializationTimeout?: number;
  enableServiceWorkers?: boolean;
}

export class WebContainerManager {
  private instance: any | null = null;
  private cleanupFunctions: (() => void)[] = [];
  private config: WebContainerManagerConfig;

  constructor(config: WebContainerManagerConfig = {}) {
    this.config = {
      initializationTimeout: 30000,
      enableServiceWorkers: true,
      ...config,
    };
  }

  async initialize(): Promise<any> {
    if (this.instance) {
      return this.instance;
    }

    try {
      // Check if WebContainer is available
      if (!WebContainer) {
        throw new Error(
          'WebContainer API is not available. Please check your browser compatibility.'
        );
      }

      // Add timeout for initialization
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('WebContainer initialization timeout')),
          this.config.initializationTimeout
        );
      });

      const bootPromise = WebContainer.boot();

      // Race between boot and timeout
      this.instance = await Promise.race([bootPromise, timeoutPromise]);

      if (!this.instance) {
        throw new Error('Failed to boot WebContainer instance');
      }

      return this.instance;
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to initialize WebContainer:', error);

      let errorMessage = 'Failed to initialize WebContainer';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'WebContainer initialization timed out. Please refresh and try again.';
        } else if (error.message.includes('browser compatibility')) {
          errorMessage = 'WebContainer requires a modern browser with service worker support.';
        } else {
          errorMessage = `WebContainer error: ${error.message}`;
        }
      }

      throw new Error(errorMessage);
    }
  }

  getInstance(): any | null {
    return this.instance;
  }

  addCleanupFunction(cleanup: () => void): void {
    this.cleanupFunctions.push(cleanup);
  }

  async teardown(): Promise<void> {
    // Execute all custom cleanup functions
    for (const cleanup of this.cleanupFunctions) {
      try {
        cleanup();
      } catch (error) {
        errorLogger.error(ErrorCategory.AI_MODEL, 'Error during custom cleanup:', error);
      }
    }
    this.cleanupFunctions = [];

    // Teardown WebContainer
    if (this.instance) {
      try {
        await this.instance.teardown();
      } catch (cleanupError) {
        errorLogger.error(ErrorCategory.AI_MODEL, 'Error during WebContainer cleanup:', cleanupError);
      } finally {
        this.instance = null;
      }
    }
  }

  isInitialized(): boolean {
    return this.instance !== null;
  }
}